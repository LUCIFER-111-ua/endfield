/**
 * 数据管理模块 - 纯前端版本
 * 负责加载和管理游戏数据
 */

const DataStore = {
    data: null,
    
    // 加载进度回调函数
    onProgress: null,
    
    // 报告加载进度
    reportProgress(file, percent) {
        if (this.onProgress) {
            this.onProgress(file, percent);
        }
    },
    
    async getAllData() {
        if (this.data) return this.data;
        
        try {
            this.reportProgress('data.json', 0);
            const response = await fetch('data/data.json');
            this.reportProgress('data.json', 50);
            this.data = await response.json();
            this.reportProgress('data.json', 100);
            return this.data;
        } catch (error) {
            console.error('Failed to load data:', error);
            return null;
        }
    },
    
    getIconUrl(iconId) {
        if (!iconId) return '';
        return `icons/item_${iconId}.webp`;
    },
    
    getItemsByCategory(category) {
        if (!this.data || !this.data.items) return [];
        return this.data.items.filter(item => item.category === category);
    },
    
    getItemById(id) {
        if (!this.data || !this.data.items) return null;
        return this.data.items.find(item => item.id === id);
    },
    
    getRecipesForItem(itemId) {
        if (!this.data || !this.data.recipes) return [];
        return this.data.recipes.filter(recipe => {
            return recipe.out && recipe.out[itemId];
        });
    },
    
    getCategories() {
        if (!this.data || !this.data.categories) return [];
        return this.data.categories;
    }
};
