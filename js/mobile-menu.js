// 移动端菜单功能
(function() {
    'use strict';

    // 初始化移动端菜单
    function initMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mainNav = document.getElementById('mainNav');
        
        if (!mobileMenuBtn || !mainNav) return;

        // 切换菜单
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenuBtn.classList.toggle('active');
            mainNav.classList.toggle('active');
        });

        // 点击导航链接后关闭菜单
        mainNav.querySelectorAll('a, button').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                mainNav.classList.remove('active');
            });
        });

        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                mobileMenuBtn.classList.remove('active');
                mainNav.classList.remove('active');
            }
        });

        // ESC 键关闭菜单
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                mobileMenuBtn.classList.remove('active');
                mainNav.classList.remove('active');
            }
        });
    }

    // 初始化触摸优化
    function initTouchOptimizations() {
        // 检测是否为触摸设备
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
        
        if (isTouchDevice) {
            document.body.classList.add('touch-device');
            
            // 防止双击缩放
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, { passive: false });
        }
    }

    // 初始化视口高度修复（解决移动端浏览器工具栏问题）
    function initViewportHeight() {
        function setVH() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initMobileMenu();
            initTouchOptimizations();
            initViewportHeight();
        });
    } else {
        initMobileMenu();
        initTouchOptimizations();
        initViewportHeight();
    }
})();
