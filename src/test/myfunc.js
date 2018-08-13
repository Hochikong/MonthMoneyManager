function getToday() {
    // 获取当前时间
    const current = new Date();
    return {
        day: current.getDate(),
        month: current.getMonth() + 1,
        year: current.getFullYear(),
    };
}

function generateCommu(head) {
    // 生成请求体
    if (head === 'query') {
        return {head: 'query', body: 'none'};
    } else if (head === 'update') {
        return {head: 'update', body: vueData.userCache};
    }
}

function queryCache() {
    // 发送请求查询cache，不能用sendSync
    ipcRenderer.send('RTOM', generateCommu('query'));
}

function writeCache() {
    // 发送更新给main.js
    ipcRenderer.send('RTOM', generateCommu('update'));
}

function cacheTOVueData() {
    // 将不需要计算的属性从cache同步至vueData
    const cache = vueData.userCache;
    vueData.cacheTotal = cache.user.total;
    vueData.remain_days = cache.user.daysRemain;
}

function vueDataToCacheUser(target, value) {
    // 将vueData变动的内容写入cache.user的指定位置
    const cache = vueData.userCache.user;
    cache.target = value;
}

function dontNeedTips() {
    vueData.needTips = false;
}

function remainDaysThisMonth(today) {
    const todayObj = new Date(today.year, today.month, 0);
    return todayObj.getDate() - today.day;
}

function updateMeta(userDataCache) {
    const meta = userDataCache.meta;
    meta.recordDay = TODAY.day;
    meta.recordMonth = TODAY.month;
    meta.recordYear = TODAY.year;
    return userDataCache;
}

function updateDayAvgandCost(userDataCache) {
    const user = userDataCache.user;
    const remainDays = remainDaysThisMonth(TODAY);
    user.dayCost = 0;
    user.dayAverage = user.remain / remainDays;
    user.daysRemain = remainDays;
    return userDataCache;
}

function updateRemain(userDataCache) {
    const cacheData = userDataCache.user;
    cacheData.remain += cacheData.dayAverage - cacheData.dayCost;
    return userDataCache;
}

function updateCache(cache) {
    vueData.userCache = updateMeta(updateDayAvgandCost(updateRemain(cache)));
}

function initalWork() {
    const cacheMeta = vueData.userCache.meta;
    if (cacheMeta.recordYear === TODAY.year && cacheMeta.recordMonth === TODAY.month) {
        if (cacheMeta.recordDay < TODAY.day) {
            // 此处满足同年同月但不同日且今天比记录日后
            updateCache(vueData.userCache);
            cacheTOVueData();
            dontNeedTips();
        } else if (cacheMeta.recordDay === TODAY.day) {
            cacheTOVueData();
            dontNeedTips();
        } else {
            alert(outOfDate);
        }
    } else {
        alert(outOfDate);
    }
}

