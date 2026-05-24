// src/context/TabBarContext.tsx
import React, { createContext, useContext, useRef } from 'react';
import { Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface TabBarContextType {
  tabBarVisible: React.MutableRefObject<Animated.Value>;
  animatedTabBarY: Animated.AnimatedInterpolation<number>;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  showTabBar: () => void;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export const TabBarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tabBarVisible = useRef(new Animated.Value(1));
  const lastScrollY = useRef(0);
  const isScrollingDown = useRef(false);

  const animatedTabBarY = tabBarVisible.current.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0], // 0 means translated off screen (80px down), 1 means fully visible (0px)
  });

  const showTabBar = () => {
    isScrollingDown.current = false;
    Animated.timing(tabBarVisible.current, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const hideTabBar = () => {
    Animated.timing(tabBarVisible.current, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const diff = currentScrollY - lastScrollY.current;

    // Avoid triggering on negative bounce in iOS, or when very close to top
    if (currentScrollY <= 20) {
      if (isScrollingDown.current) {
        showTabBar();
      }
      lastScrollY.current = currentScrollY;
      return;
    }

    if (Math.abs(diff) > 5) {
      if (diff > 0) {
        // Scrolling down
        if (!isScrollingDown.current) {
          isScrollingDown.current = true;
          hideTabBar();
        }
      } else if (diff < 0) {
        // Scrolling up
        if (isScrollingDown.current) {
          isScrollingDown.current = false;
          showTabBar();
        }
      }
    }
    lastScrollY.current = currentScrollY;
  };

  return (
    <TabBarContext.Provider value={{ tabBarVisible, animatedTabBarY, handleScroll, showTabBar }}>
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBar = () => {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBar must be used within a TabBarProvider');
  }
  return context;
};
