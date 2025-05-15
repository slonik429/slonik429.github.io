const canvas = document.getElementById("gameCanvas");
if (!canvas) {
    console.error("Canvas element not found!");
    throw new Error("Canvas not initialized");
}
const ctx = canvas.getContext("2d");
if (!ctx) {
    console.error("2D context not available!");
    throw new Error("Canvas context failed");
}
const bgCanvas = document.createElement("canvas");
const bgCtx = bgCanvas.getContext("2d");

// Игровые переменные
let state = {
    money: 500,
    reputation: 10,
    customerOpinion: 50,
    day: 1,
    stores: 1,
    storeLevel: 1,
    storeCapacity: 20,
    hallCapacity: 10,
    cameras: 0,
    employees: [],
    inventory: {
        food: { quantity: 10, cost: 5, price: 10, shelfLife: 5, demandBase: 20 },
        electronics: { quantity: 5, cost: 20, price: 50, shelfLife: 10, demandBase: 10 }
    },
    customers: { food: 0, electronics: 0 },
    marketing: { budget: 0, effect: 1 },
    competitors: { priceFactor: 1 },
    message: "Добро пожаловать! Нажмите 'Следующий день' для начала.",
    messageAlpha: 1,
    location: "shop",
    tutorialStep: 0,
    transition: { active: false, alpha: 1 },
    assistant: {
        message: "Тестовое сообщение!",
        alpha: 1,
        lastMessageTime: 0,
        cooldown: 5000
    },
    achievements: [],
    warehouseWins: 0,
    negotiationWins: 0,
    soundOn: true,
    volume: 0.5 // Добавляем громкость (по умолчанию 50%)
};
console.log("Initial state loaded:", state);

const rentCost = 100;
const employeeSalary = 50;
const maxMarketingEffect = 2;

// Базовые размеры для масштабирования
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;

// Фоны локаций
const backgrounds = {
    shop: {
        level1_3: `<svg width="100%" height="100%" viewBox="0 0 800 600">
            <rect x="0" y="0" width="800" height="600" fill="#f5f5f5"/>
            <rect x="50" y="50" width="700" height="500" fill="#fff" stroke="#333" stroke-width="2"/>
            <rect x="100" y="400" width="600" height="100" fill="#d3d3d3"/>
            <circle cx="150" cy="350" r="20" fill="#4CAF50"/>
            <circle cx="200" cy="360" r="20" fill="#4CAF50"/>
        </svg>`,
        level4_6: `<svg width="100%" height="100%" viewBox="0 0 800 600">
            <rect x="0" y="0" width="800" height="600" fill="#f5f5f5"/>
            <rect x="50" y="50" width="700" height="500" fill="#fff" stroke="#333" stroke-width="2"/>
            <rect x="100" y="400" width="600" height="100" fill="#d3d3d3"/>
            <rect x="100" y="300" width="100" height="50" fill="#8D6E63"/>
            <rect x="250" y="300" width="100" height="50" fill="#8D6E63"/>
            <circle cx="150" cy="350" r="20" fill="#4CAF50"/>
            <circle cx="200" cy="360" r="20" fill="#4CAF50"/>
        </svg>`,
        level7_10: `<svg width="100%" height="100%" viewBox="0 0 800 600">
            <rect x="0" y="0" width="800" height="600" fill="#f5f5f5"/>
            <rect x="50" y="50" width="700" height="500" fill="#fff" stroke="#333" stroke-width="2"/>
            <rect x="100" y="400" width="600" height="100" fill="#d3d3d3"/>
            <rect x="100" y="300" width="100" height="50" fill="#8D6E63"/>
            <rect x="250" y="300" width="100" height="50" fill="#8D6E63"/>
            <circle cx="150" cy="350" r="20" fill="#4CAF50"/>
            <circle cx="200" cy="360" r="20" fill="#4CAF50"/>
            <rect x="50" y="50" width="700" height="20" fill="#FFD700"/>
        </svg>`
    },
    market: `<svg width="100%" height="100%" viewBox="0 0 800 600">
        <rect x="0" y="0" width="800" height="600" fill="#e0e0e0"/>
        <rect x="50" y="50" width="700" height="500" fill="#fff" stroke="#333" stroke-width="2"/>
        <rect x="100" y="400" width="200" height="80" fill="#FF9800"/>
        <rect x="400" y="400" width="200" height="80" fill="#FF9800"/>
    </svg>`,
    agency: `<svg width="100%" height="100%" viewBox="0 0 800 600">
        <rect x="0" y="0" width="800" height="600" fill="#e8eaf6"/>
        <rect x="50" y="50" width="700" height="500" fill="#fff" stroke="#333" stroke-width="2"/>
        <rect x="300" y="400" width="200" height="80" fill="#795548"/>
        <rect x="350" y="380" width="100" height="20" fill="#4CAF50"/>
    </svg>`
};

// Изображения
const assistantImage = new Image();
assistantImage.src = 'images/assistant.png';
assistantImage.onerror = () => console.error("Failed to load assistant.png");

const smileGreen = new Image();
smileGreen.src = 'images/smile_green.png';
smileGreen.onerror = () => console.error("Failed to load smile_green.png");

const smileYellow = new Image();
smileYellow.src = 'images/smile_yellow.png';
smileYellow.onerror = () => console.error("Failed to load smile_yellow.png");

const smileOrange = new Image();
smileOrange.src = 'images/smile_orange.png';
smileOrange.onerror = () => console.error("Failed to load smile_orange.png");

const smileRed = new Image();
smileRed.src = 'images/smile_red.png';
smileRed.onerror = () => console.error("Failed to load smile_red.png");

const foodIcon = new Image();
foodIcon.src = 'images/food_icon.png';
foodIcon.onerror = () => console.error("Failed to load food_icon.png");

const electronicsIcon = new Image();
electronicsIcon.src = 'images/electronics_icon.png';
electronicsIcon.onerror = () => console.error("Failed to load electronics_icon.png");

const supplierImage = new Image();
supplierImage.src = 'images/supplier.png';
supplierImage.onerror = () => console.error("Failed to load supplier.png");

// Фоновая музыка (один трек для всех локаций)
const backgroundMusic = new Audio('audio/background_music.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = state.volume;
backgroundMusic.onerror = () => console.error("Failed to load background_music.mp3");

// Воспроизведение музыки
function playBackgroundMusic() {
    if (!state.soundOn) return;
    backgroundMusic.play().catch(err => console.error("Music play failed:", err));
    console.log("Playing background music");
}

// Переключение звука
function toggleSound() {
    state.soundOn = !state.soundOn;
    if (state.soundOn) {
        playBackgroundMusic();
        state.message = "Звук включён!";
    } else {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        state.message = "Звук выключен.";
    }
    state.messageAlpha = 1;
    saveState();
    console.log("Sound toggled:", state.soundOn);
}

// Регулировка громкости
function updateVolume(value) {
    state.volume = value;
    backgroundMusic.volume = state.volume;
    state.message = `Громкость: ${Math.round(state.volume * 100)}%`;
    state.messageAlpha = 1;
    saveState();
    console.log("Volume updated:", state.volume);
}

// Установка размеров
let scaleFactor = 1;
function resizeCanvas() {
    const minWidth = 320;
    const minHeight = 480;

    const dpr = window.devicePixelRatio || 1;
    const windowWidth = window.innerWidth * dpr;
    const windowHeight = window.innerHeight * dpr;

    canvas.width = Math.max(windowWidth, minWidth);
    canvas.height = Math.max(windowHeight, minHeight);
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;

    scaleFactor = Math.min(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT);
    canvas.style.width = `${canvas.width / dpr}px`;
    canvas.style.height = `${canvas.height / dpr}px`;
    console.log("Canvas resized. ScaleFactor:", scaleFactor, "Canvas size:", canvas.width, canvas.height);

    cacheBackground(state.location);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Кэширование фонов
function cacheBackground(location) {
    const svg = new Image();
    if (location === "shop") {
        if (state.storeLevel <= 3) {
            svg.src = 'data:image/svg+xml,' + encodeURIComponent(backgrounds.shop.level1_3);
        } else if (state.storeLevel <= 6) {
            svg.src = 'data:image/svg+xml,' + encodeURIComponent(backgrounds.shop.level4_6);
        } else {
            svg.src = 'data:image/svg+xml,' + encodeURIComponent(backgrounds.shop.level7_10);
        }
    } else {
        svg.src = 'data:image/svg+xml,' + encodeURIComponent(backgrounds[location]);
    }
    svg.onload = () => {
        console.log("Background cached for location:", location);
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.drawImage(svg, 0, 0, bgCanvas.width, bgCanvas.height);
    };
    svg.onerror = () => console.error("Failed to load background for location:", location);
}

// Сохранение/загрузка
function saveState() {
    localStorage.setItem('gameState', JSON.stringify(state));
    console.log("State saved:", state);
}
function loadState() {
    const saved = localStorage.getItem('gameState');
    if (saved) {
        state = JSON.parse(saved);
        console.log("Loaded saved state:", state);
    } else {
        state.tutorialStep = 1;
        state.soundOn = true;
        state.volume = 0.5; // Громкость по умолчанию
        console.log("No saved state, starting fresh with tutorial step 1");
    }
    // Загружаем громкость из localStorage, если есть
    const savedVolume = localStorage.getItem("gameVolume");
    if (savedVolume) {
        state.volume = parseFloat(savedVolume);
    }
    backgroundMusic.volume = state.volume; // Устанавливаем громкость после загрузки
    cacheBackground(state.location);
    playBackgroundMusic(); // Запускаем музыку после загрузки
}
loadState();

// Локации
function switchLocation(location) {
    if (state.transition.active) return;
    state.transition.active = true;
    state.transition.alpha = 1;
    console.log("Switching to location:", location);
    const fadeOut = setInterval(() => {
        state.transition.alpha -= 0.05;
        if (state.transition.alpha <= 0) {
            clearInterval(fadeOut);
            state.location = location;
            state.message = `Вы в ${location === "shop" ? "Магазине" : location === "market" ? "Рынке" : "Агентстве"}`;
            state.messageAlpha = 1;
            cacheBackground(location);
            const fadeIn = setInterval(() => {
                state.transition.alpha += 0.05;
                if (state.transition.alpha >= 1) {
                    clearInterval(fadeIn);
                    state.transition.active = false;
                    console.log("Location switch completed");
                }
            }, 16);
        }
    }, 16);
}

// Выход с сохранением
function saveAndExit() {
    saveState();
    window.location.href = 'index.html';
    console.log("Save and Exit triggered");
}

// Покупка товаров
function buyItem(item) {
    if (state.location !== "market") return;
    const totalInventory = Object.values(state.inventory).reduce((sum, i) => sum + i.quantity, 0);
    if (totalInventory + 10 > state.storeCapacity) {
        state.message = "Склад переполнен!".substring(0, 40);
        state.messageAlpha = 1;
        return;
    }
    const cost = state.inventory[item].cost * 10;
    if (state.money >= cost) {
        state.money -= cost;
        state.inventory[item].quantity += 10;
        state.message = `Куплено 10 ${item === "food" ? "еды" : "электроники"}!`.substring(0, 40);
        state.messageAlpha = 1;
        if (state.tutorialStep === 2) state.tutorialStep = 3;
    } else {
        state.message = "Недостаточно денег!".substring(0, 40);
        state.messageAlpha = 1;
    }
    console.log("Buy item action:", item, "State:", state);
}

// Изменение цены
function changePrice(item, delta) {
    if (state.location !== "shop") return;
    const newPrice = state.inventory[item].price + delta;
    if (newPrice >= state.inventory[item].cost) {
        state.inventory[item].price = newPrice;
        state.message = `Новая цена ${item === "food" ? "еды" : "электроники"}: ${newPrice}`.substring(0, 40);
        state.messageAlpha = 1;
        if (state.tutorialStep === 1) state.tutorialStep = 2;
        updateCompetitors(item, newPrice);
    } else {
        state.message = "Цена ниже закупочной!".substring(0, 40);
        state.messageAlpha = 1;
    }
    console.log("Price changed for:", item, "New price:", newPrice);
}

// Маркетинг
function investMarketing(amount) {
    if (state.location !== "shop") return;
    if (state.money >= amount) {
        state.money -= amount;
        state.marketing.budget += amount;
        state.marketing.effect = Math.min(maxMarketingEffect, 1 + state.marketing.budget / 1000);
        state.message = `Инвестировано ${amount}! Спрос: +${Math.round((state.marketing.effect - 1) * 100)}%`.substring(0, 40);
        state.messageAlpha = 1;
        if (state.tutorialStep === 4) state.tutorialStep = 5;
    } else {
        state.message = "Недостаточно денег!".substring(0, 40);
        state.messageAlpha = 1;
    }
    console.log("Marketing invested:", amount, "Effect:", state.marketing.effect);
}

// Акции для повышения мнения клиентов
function runCampaign() {
    if (state.location !== "shop") return;
    const cost = 300;
    const opinionGain = 10;
    if (state.money >= cost) {
        state.money -= cost;
        state.customerOpinion = Math.min(100, state.customerOpinion + opinionGain);
        state.message = `Проведена акция! Мнение +${opinionGain}`.substring(0, 40);
        state.messageAlpha = 1;
    } else {
        state.message = "Недостаточно денег! Нужно 300.".substring(0, 40);
        state.messageAlpha = 1;
    }
    console.log("Campaign run. New customer opinion:", state.customerOpinion);
}

// Найм сотрудника
function hireEmployee() {
    if (state.location !== "agency") return;
    if (state.employees.length >= state.storeLevel) {
        state.message = "Лимит сотрудников достигнут!".substring(0, 40);
        state.messageAlpha = 1;
        return;
    }
    if (state.money >= 200) {
        state.money -= 200;
        state.employees.push({ type: "seller", salary: employeeSalary });
        state.message = "Нанят продавец! Спрос увеличен.".substring(0, 40);
        state.messageAlpha = 1;
        checkAchievements();
    } else {
        state.message = "Недостаточно денег!".substring(0, 40);
        state.messageAlpha = 1;
    }
    console.log("Employee hired. Employees:", state.employees.length);
}

// Покупка магазина
function buyStore() {
    if (state.location !== "agency") return;
    if (state.money >= 5000) {
        state.money -= 5000;
        state.stores += 1;
        state.message = `Куплен магазин! Всего: ${state.stores}`.substring(0, 40);
        state.messageAlpha = 1;
    } else {
        state.message = "Нужно 5000!".substring(0, 40);
        state.messageAlpha = 1;
    }
    console.log("Store bought. Total stores:", state.stores);
}

// Улучшения магазина
function upgradeStoreCapacity() {
    if (state.location !== "agency") return;
    const cost = 500;
    if (state.money >= cost) {
        state.money -= cost;
        state.storeCapacity += 10;
        state.message = "Вместимость склада +10!".substring(0, 40);
        state.messageAlpha = 1;
    } else {
        state.message = "Нужно 500!".substring(0, 40);
        state.messageAlpha = 1;
    }
    console.log("Store capacity upgraded to:", state.storeCapacity);
}

function upgradeHallCapacity() {
    if (state.location !== "agency") return;
    const cost = 300;
    if (state.money >= cost) {
        state.money -= cost;
        state.hallCapacity += 5;
        state.message = "Вместимость зала +5!".substring(0, 40);
        state.messageAlpha = 1;
    } else {
        state.message = "Нужно 300!".substring(0, 40);
        state.messageAlpha = 1;
    }
    console.log("Hall capacity upgraded to:", state.hallCapacity);
}

function buyCamera() {
    if (state.location !== "agency") return;
    if (state.cameras >= state.storeLevel) {
        state.message = "Лимит камер достигнут!".substring(0, 40);
        state.messageAlpha = 1;
        return;
    }
    const cost = 200;
    if (state.money >= cost) {
        state.money -= cost;
        state.cameras += 1;
        state.message = "Куплена камера видеонаблюдения!".substring(0, 40);
        state.messageAlpha = 1;
        checkAchievements();
    } else {
        state.message = "Нужно 200!".substring(0, 40);
        state.messageAlpha = 1;
    }
    console.log("Camera bought. Total cameras:", state.cameras);
}

function upgradeStoreLevel() {
    if (state.location !== "agency") return;
    if (state.storeLevel >= 10) {
        state.message = "Максимальный уровень магазина!".substring(0, 40);
        state.messageAlpha = 1;
        return;
    }
    const cost = 1000 * Math.pow(2, state.storeLevel - 1);
    if (state.money >= cost) {
        state.money -= cost;
        state.storeLevel += 1;
        state.message = `Магазин повышен до ${state.storeLevel} уровня!`.substring(0, 40);
        state.messageAlpha = 1;
        cacheBackground(state.location);
        checkAchievements();
    } else {
        state.message = `Нужно ${cost}!`.substring(0, 40);
        state.messageAlpha = 1;
    }
    console.log("Store level upgraded to:", state.storeLevel);
}

// Конкуренция
function updateCompetitors(item, newPrice) {
    if (newPrice < state.inventory[item].cost * 1.5) {
        state.competitors.priceFactor = Math.max(0.7, state.competitors.priceFactor - 0.1);
        state.message = "Конкуренты снизили цены!".substring(0, 40);
        state.messageAlpha = 1;
    }
    console.log("Competitors updated. Price factor:", state.competitors.priceFactor);
}

// Спрос
function calculateDemand(item) {
    const price = state.inventory[item].price;
    const baseDemand = state.inventory[item].demandBase;
    const competitorEffect = state.competitors.priceFactor;
    const marketingEffect = state.marketing.effect;
    const employeeBoost = state.employees.filter(e => e.type === "seller").length * 0.1;
    return Math.max(0, Math.floor(baseDemand * marketingEffect * (1 + employeeBoost) / competitorEffect - (price - state.inventory[item].cost) * 0.5));
}

// Порча товаров
function spoilItems() {
    for (let item in state.inventory) {
        state.inventory[item].shelfLife -= 1;
        if (state.inventory[item].shelfLife <= 0 && state.inventory[item].quantity > 0) {
            const spoiled = Math.min(state.inventory[item].quantity, 5);
            state.inventory[item].quantity -= spoiled;
            state.inventory[item].shelfLife = item === "food" ? 5 : 10;
            state.message = `${spoiled} ${item === "food" ? "еды" : "электроники"} испортилось!`.substring(0, 40);
            state.messageAlpha = 1;
        }
    }
    console.log("Spoil items checked. Inventory:", state.inventory);
}

// Мнение покупателей
function updateCustomerOpinion() {
    let isSatisfied = true;
    if (state.day > 3) {
        for (let item in state.inventory) {
            if (state.inventory[item].price > state.inventory[item].cost * 1.5 || state.inventory[item].quantity === 0) {
                state.customerOpinion = Math.max(0, state.customerOpinion - 2);
                isSatisfied = false;
                break;
            }
        }
    }
    if (isSatisfied) {
        state.customerOpinion = Math.min(100, state.customerOpinion + 1);
    }
    console.log("Customer opinion updated:", state.customerOpinion);
    checkAchievements();
}

// Воровство
function handleTheft() {
    const baseStealChance = 10;
    const stealChance = Math.max(0, Math.min(50, baseStealChance + (state.hallCapacity - 10) * 0.5 - state.employees.length * 2 - state.cameras * 3));
    const totalSold = Object.values(state.customers).reduce((sum, qty) => sum + qty, 0);
    if (totalSold > 0 && Math.random() * 100 < stealChance) {
        const stolenAmount = Math.floor(Math.random() * 5) + 1;
        let stolen = 0;
        for (let item in state.inventory) {
            const toSteal = Math.min(state.inventory[item].quantity, stolenAmount - stolen);
            state.inventory[item].quantity -= toSteal;
            stolen += toSteal;
            if (stolen >= stolenAmount) break;
        }
        state.message = `Украдено ${stolen} товаров!`.substring(0, 40);
        state.messageAlpha = 1;
    }
    console.log("Theft checked. Steal chance:", stealChance);
}

// Ассистент
function updateAssistant(timestamp) {
    if (timestamp - state.assistant.lastMessageTime < state.assistant.cooldown) return;

    let assistantMessage = "";
    if (state.inventory.food.quantity <= 5) {
        assistantMessage = "Запасы еды на исходе! Сходи на Рынок.";
    } else if (state.inventory.electronics.quantity <= 5) {
        assistantMessage = "Запасы электроники заканчиваются!";
    } else if (state.money < 200 && state.location === "shop") {
        assistantMessage = "Мало денег! Попробуй продать больше.";
    } else if (state.day % 10 === 9) {
        assistantMessage = "Завтра нужно платить аренду!";
    } else if (state.day % 7 === 6) {
        assistantMessage = "Завтра день зарплат!";
    } else if (state.competitors.priceFactor < 0.8) {
        assistantMessage = "Конкуренты снизили цены! Пора действовать.";
    } else if (state.customerOpinion < 25) {
        assistantMessage = "Покупатели недовольны! Проверь цены.";
    }

    if (assistantMessage) {
        state.assistant.message = assistantMessage.substring(0, 40);
        state.assistant.alpha = 1;
        state.assistant.lastMessageTime = timestamp;
    }
    console.log("Assistant updated. Message:", state.assistant.message);
}

// Достижения
const achievementsList = [
    { id: "newbie", name: "Новичок", description: "Достигни 2 уровня магазина", condition: () => state.storeLevel >= 2 },
    { id: "businessman", name: "Бизнесмен", description: "Заработай 5000 денег", condition: () => state.money >= 5000 },
    { id: "popular", name: "Популярный", description: "Достигни 75 мнения покупателей", condition: () => state.customerOpinion >= 75 },
    { id: "employer", name: "Работодатель", description: "Нанять 3 сотрудников", condition: () => state.employees.length >= 3 },
    { id: "security", name: "Безопасность", description: "Установи 2 камеры видеонаблюдения", condition: () => state.cameras >= 2 },
    { id: "warehouseMaster", name: "Мастер склада", description: "Выиграй 5 раз в 'Расстановке товаров'", condition: () => state.warehouseWins >= 5 },
    { id: "edBrodou", name: "Эд Бродоу", description: "Выиграй 10 раз в 'Переговорах с поставщиком'", condition: () => state.negotiationWins >= 10 }
];

function checkAchievements() {
    achievementsList.forEach(achievement => {
        if (!state.achievements.includes(achievement.id) && achievement.condition()) {
            state.achievements.push(achievement.id);
            state.message = `Достижение: ${achievement.name}!`.substring(0, 40);
            state.messageAlpha = 1;
            saveState();
        }
    });
    console.log("Achievements checked. Total:", state.achievements.length);
}

// Мини-игра: Расстановка товаров
let warehouseGame = {
    active: false,
    timer: 30,
    items: [
        { type: "food", x: 50, y: 50, placed: false },
        { type: "electronics", x: 150, y: 50, placed: false }
    ],
    slots: [
        { type: "food", x: 50, y: 200 },
        { type: "electronics", x: 150, y: 200 }
    ],
    selectedItem: null,
    lastTime: 0,
    spoilReduction: 0
};

function startWarehouseGame() {
    if (state.location !== "shop") return;
    warehouseGame.active = true;
    warehouseGame.timer = 30;
    warehouseGame.items = [
        { type: "food", x: 50, y: 50, placed: false },
        { type: "electronics", x: 150, y: 50, placed: false }
    ];
    warehouseGame.spoilReduction = 0;
    state.message = "Расставьте товары на склад! (30 сек)";
    state.messageAlpha = 1;
    console.log("Warehouse game started");
}

function drawWarehouseGame() {
    if (!warehouseGame.active) return;

    ctx.save();
    ctx.scale(scaleFactor, scaleFactor);

    ctx.fillStyle = "#e0f7fa";
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    warehouseGame.slots.forEach(slot => {
        ctx.beginPath();
        ctx.rect(slot.x - 20, slot.y - 20, 40, 40);
        ctx.stroke();
        ctx.fillStyle = "#FFF";
        ctx.font = "12px Arial";
        ctx.fillText(slot.type[0].toUpperCase(), slot.x - 5, slot.y + 5);
    });

    warehouseGame.items.forEach(item => {
        if (!item.placed) {
            const iconImage = item.type === "food" ? foodIcon : electronicsIcon;
            if (iconImage.complete && iconImage.naturalWidth !== 0) {
                ctx.drawImage(iconImage, item.x - 20, item.y - 20, 40, 40);
            } else {
                ctx.fillStyle = item.type === "food" ? "#4CAF50" : "#2196F3";
                ctx.beginPath();
                ctx.arc(item.x, item.y, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#FFF";
                ctx.fillText(item.type[0].toUpperCase(), item.x - 5, item.y + 5);
            }
        }
    });

    ctx.fillStyle = "#333";
    ctx.font = "20px Arial";
    ctx.fillText(`Время: ${Math.ceil(warehouseGame.timer)}`, 350, 50);

    const backX = BASE_WIDTH - 180;
    const backY = 20;
    const backWidth = 160;
    const backHeight = 40;
    const backHover = mouseX / scaleFactor >= backX && mouseX / scaleFactor <= backX + backWidth && mouseY / scaleFactor >= backY && mouseY / scaleFactor <= backY + backHeight;
    ctx.fillStyle = backHover ? "#FF5252" : "#F44336";
    ctx.beginPath();
    ctx.roundRect(backX, backY, backWidth, backHeight, 5);
    ctx.fill();
    ctx.fillStyle = "#FFF";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Назад", backX + backWidth / 2, backY + 28);

    ctx.textAlign = "start";
    ctx.restore();
    console.log("Warehouse game drawn");
}

function updateWarehouseGame(timestamp) {
    if (!warehouseGame.active) return;
    if (!warehouseGame.lastTime) warehouseGame.lastTime = timestamp;
    if (timestamp - warehouseGame.lastTime >= 1000) {
        warehouseGame.timer -= 1;
        warehouseGame.lastTime = timestamp;
        if (warehouseGame.timer <= 0) endWarehouseGame(false);
        console.log("Warehouse timer updated:", warehouseGame.timer);
    }
}

function endWarehouseGame(success) {
    warehouseGame.active = false;
    if (success) {
        state.warehouseWins += 1;
        warehouseGame.spoilReduction = 0.1;
        state.message = "Товары расставлены! Шанс порчи -10%.";
        state.messageAlpha = 1;
        checkAchievements();
    } else {
        state.message = "Не успели! Товары испортятся.";
        state.messageAlpha = 1;
    }
    saveState();
    console.log("Warehouse game ended. Success:", success);
}

// Мини-игра: Переговоры
let negotiationGame = {
    active: false,
    question: "",
    options: [],
    correctAnswer: "",
    timer: 15,
    lastTime: 0,
    costReduction: 0
};

function startNegotiationGame() {
    if (state.location !== "market") return;
    negotiationGame.active = true;
    negotiationGame.timer = 15;
    const questions = [
        { q: "Какой у вас спрос на еду?", options: ["Высокий", "Средний", "Низкий"], correct: "Низкий" },
        { q: "Сколько вы готовы заплатить?", options: ["Меньше", "Точно столько", "Больше"], correct: "Меньше" },
        { q: "Какой у вас оборот?", options: ["Большой", "Средний", "Маленький"], correct: "Маленький" }
    ];
    const randomQ = questions[Math.floor(Math.random() * questions.length)];
    negotiationGame.question = randomQ.q;
    negotiationGame.options = [...randomQ.options];
    negotiationGame.correctAnswer = randomQ.correct;
    negotiationGame.costReduction = 0;
    state.message = "Уговорите поставщика! (15 сек)";
    state.messageAlpha = 1;
    console.log("Negotiation game started. Question:", negotiationGame.question);
}

function drawNegotiationGame() {
    if (!negotiationGame.active) return;

    ctx.save();
    ctx.scale(scaleFactor, scaleFactor);

    ctx.fillStyle = "#e0f7fa";
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    if (supplierImage.complete && supplierImage.naturalWidth !== 0) {
        ctx.drawImage(supplierImage, 600, 200, 100, 150);
    } else {
        ctx.fillStyle = "#795548";
        ctx.fillRect(600, 200, 100, 150);
        ctx.fillStyle = "#FFF";
        ctx.font = "16px Arial";
        ctx.fillText("Supplier", 610, 250);
    }

    ctx.fillStyle = "#333";
    ctx.font = "20px Arial";
    ctx.fillText(negotiationGame.question, 50, 100);

    negotiationGame.options.forEach((option, i) => {
        const y = 150 + i * 50;
        const hover = mouseX / scaleFactor >= 50 && mouseX / scaleFactor <= 350 && mouseY / scaleFactor >= y && mouseY / scaleFactor <= y + 40;
        ctx.fillStyle = hover ? "#FFD54F" : "#FBC02D";
        ctx.beginPath();
        ctx.roundRect(50, y, 300, 40, 5);
        ctx.fill();
        ctx.fillStyle = "#333";
        ctx.fillText(option, 70, y + 28);
    });

    ctx.fillText(`Время: ${Math.ceil(negotiationGame.timer)}`, 350, 50);

    const backX = BASE_WIDTH - 180;
    const backY = 20;
    const backWidth = 160;
    const backHeight = 40;
    const backHover = mouseX / scaleFactor >= backX && mouseX / scaleFactor <= backX + backWidth && mouseY / scaleFactor >= backY && mouseY / scaleFactor <= backY + backHeight;
    ctx.fillStyle = backHover ? "#FF5252" : "#F44336";
    ctx.beginPath();
    ctx.roundRect(backX, backY, backWidth, backHeight, 5);
    ctx.fill();
    ctx.fillStyle = "#FFF";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Назад", backX + backWidth / 2, backY + 28);

    ctx.textAlign = "start";
    ctx.restore();
    console.log("Negotiation game drawn");
}

function updateNegotiationGame(timestamp) {
    if (!negotiationGame.active) return;
    if (!negotiationGame.lastTime) negotiationGame.lastTime = timestamp;
    if (timestamp - negotiationGame.lastTime >= 1000) {
        negotiationGame.timer -= 1;
        negotiationGame.lastTime = timestamp;
        if (negotiationGame.timer <= 0) endNegotiationGame(false);
        console.log("Negotiation timer updated:", negotiationGame.timer);
    }
}

function endNegotiationGame(success) {
    negotiationGame.active = false;
    if (success) {
        state.negotiationWins += 1;
        negotiationGame.costReduction = 0.1;
        state.message = "Скидка получена! -10% на закупку.";
        state.messageAlpha = 1;
        for (let item in state.inventory) {
            state.inventory[item].cost *= (1 - negotiationGame.costReduction);
        }
        checkAchievements();
    } else {
        state.message = "Поставщик недоволен! Репутация -5.";
        state.messageAlpha = 1;
        state.reputation = Math.max(0, state.reputation - 5);
    }
    saveState();
    console.log("Negotiation game ended. Success:", success);
}

// Следующий день
function nextDay() {
    if (state.location !== "shop") return;

    console.log(`Starting nextDay(). Day: ${state.day}, Money: ${state.money}, Reputation: ${state.reputation}, Employees: ${state.employees.length}`);

    // Продажа товаров
    for (let item in state.inventory) {
        state.customers[item] = calculateDemand(item) * state.stores;
        let sold = Math.min(state.customers[item], state.inventory[item].quantity, state.hallCapacity);
        let income = sold * state.inventory[item].price;
        state.money += income;
        state.inventory[item].quantity -= sold;
        if (sold > 0) {
            state.message = `Продано ${sold} ${item === "food" ? "еды" : "электроники"}, +${income}`.substring(0, 40);
            state.messageAlpha = 1;
        }
    }

    // Порча товаров
    for (let item in state.inventory) {
        state.inventory[item].shelfLife -= 1;
        if (state.inventory[item].shelfLife <= 0 && state.inventory[item].quantity > 0) {
            const spoilChance = Math.random();
            if (spoilChance > warehouseGame.spoilReduction) {
                const spoiled = Math.min(state.inventory[item].quantity, 5);
                state.inventory[item].quantity -= spoiled;
                state.inventory[item].shelfLife = item === "food" ? 5 : 10;
                state.message = `${spoiled} ${item === "food" ? "еды" : "электроники"} испортилось!`.substring(0, 40);
                state.messageAlpha = 1;
            } else {
                state.inventory[item].shelfLife = item === "food" ? 5 : 10;
                state.message = "Порча предотвращена благодаря расстановке!";
                state.messageAlpha = 1;
            }
        }
    }
    warehouseGame.spoilReduction = 0;

    // Сброс скидки на закупку
    for (let item in state.inventory) {
        if (negotiationGame.costReduction > 0) {
            state.inventory[item].cost /= (1 - negotiationGame.costReduction);
        }
    }
    negotiationGame.costReduction = 0;

    // Обновление мнения покупателей и воровство
    updateCustomerOpinion();
    handleTheft();

    // Проверка на отсутствие товаров
    let noStock = Object.keys(state.inventory).every(item => state.inventory[item].quantity === 0 && state.customers[item] > 0);
    if (noStock) {
        state.reputation = Math.max(0, state.reputation - 10);
        state.message = "Клиенты ушли! Репутация -10".substring(0, 40);
        state.messageAlpha = 1;
    }

    // Зарплаты (каждые 7 дней)
    let paidSalary = true;
    if (state.day % 7 === 0) {
        const totalSalary = state.employees.reduce((sum, e) => sum + e.salary, 0);
        if (state.money >= totalSalary) {
            state.money -= totalSalary;
            state.message = `Зарплаты: -${totalSalary}`.substring(0, 40);
            state.messageAlpha = 1;
        } else {
            state.reputation = Math.max(0, state.reputation - 15);
            state.message = "Нет денег на зарплаты! -15".substring(0, 40);
            state.messageAlpha = 1;
            paidSalary = false;
        }
    }

    // Аренда (каждые 10 дней)
    if (state.day % 10 === 0) {
        const totalRent = rentCost * state.stores;
        let paidRent = false;
        if (state.money >= totalRent) {
            state.money -= totalRent;
            state.message = `Аренда: -${totalRent}`.substring(0, 40);
            state.messageAlpha = 1;
            paidRent = true;
        } else if (state.reputation >= 5 * state.stores) {
            state.reputation -= 5 * state.stores;
            state.message = `Аренда оплачена репутацией!`.substring(0, 40);
            state.messageAlpha = 1;
            paidRent = true;
        } else {
            state.reputation = Math.max(0, state.reputation - 20);
            state.message = "Нет денег на аренду! -20".substring(0, 40);
            state.messageAlpha = 1;
        }
        if (paidRent && state.day % 5 === 0) {
            if (state.customerOpinion >= 50 && paidSalary) {
                state.reputation += 1;
                state.message = "Репутация +1!".substring(0, 40);
                state.messageAlpha = 1;
            } else {
                state.reputation = Math.max(0, state.reputation - 2);
                state.message = "Репутация -2!".substring(0, 40);
                state.messageAlpha = 1;
            }
        }
    }

    // Конкуренты
    state.competitors.priceFactor = 0.8 + Math.random() * 0.4;
    if (Math.random() < 0.2) {
        state.competitors.priceFactor *= 0.7;
        state.message = "Распродажа конкурентов!".substring(0, 40);
        state.messageAlpha = 1;
    }

    // Увеличение дня
    state.day += 1;
    console.log(`Day incremented to ${state.day}. Reputation: ${state.reputation}, Money: ${state.money}`);

    // Изменение закупочных цен
    for (let item in state.inventory) {
        if (Math.random() < 0.3) {
            state.inventory[item].cost = Math.max(3, state.inventory[item].cost + Math.floor(Math.random() * 5 - 2));
        }
    }

    // Обновление туториала
    if (state.tutorialStep === 3) state.tutorialStep = 4;
    if (state.tutorialStep === 5) state.tutorialStep = 0;

    saveState();
    console.log("Next day processed. Day:", state.day);
}

// Туториал
const tutorialMessages = [
    "",
    "Измените цену еды для начала.",
    "Перейдите на Рынок, купите еду.",
    "Вернитесь в Магазин, нажмите 'День'.",
    "Инвестируйте в маркетинг!",
    "Вы готовы к бизнесу!"
];

// Кнопки по локациям
const locationButtons = {
    shop: [
        { x: 50, y: 400, w: 200, h: 50, text: "Еда +5", action: () => changePrice("food", 5) },
        { x: 260, y: 400, w: 200, h: 50, text: "Еда -5", action: () => changePrice("food", -5) },
        { x: 50, y: 460, w: 200, h: 50, text: "Эл. +10", action: () => changePrice("electronics", 10) },
        { x: 260, y: 460, w: 200, h: 50, text: "Эл. -10", action: () => changePrice("electronics", -10) },
        { x: 470, y: 400, w: 200, h: 50, text: "Марк. 100", action: () => investMarketing(100) },
        { x: 470, y: 460, w: 200, h: 50, text: "Марк. 500", action: () => investMarketing(500) },
        { x: 50, y: 520, w: 200, h: 50, text: "Рынок", action: () => switchLocation("market") },
        { x: 260, y: 520, w: 200, h: 50, text: "Агентство", action: () => switchLocation("agency") },
        { x: 470, y: 520, w: 200, h: 50, text: "Расставить", action: startWarehouseGame },
        { x: 680, y: 520, w: 100, h: 50, text: "Акции", action: runCampaign, price: () => 300 }
    ],
    market: [
        { x: 50, y: 400, w: 200, h: 50, text: "Куп. еду", action: () => buyItem("food"), price: () => state.inventory.food.cost * 10 },
        { x: 50, y: 460, w: 200, h: 50, text: "Куп. эл.", action: () => buyItem("electronics"), price: () => state.inventory.electronics.cost * 10 },
        { x: 50, y: 520, w: 200, h: 50, text: "Магазин", action: () => switchLocation("shop") },
        { x: 260, y: 520, w: 200, h: 50, text: "Переговоры", action: startNegotiationGame }
    ],
    agency: [
        { x: 50, y: 400, w: 200, h: 50, text: "Нанять", action: hireEmployee, price: () => 200 },
        { x: 50, y: 460, w: 200, h: 50, text: "Куп. маг.", action: buyStore, price: () => 5000 },
        { x: 260, y: 400, w: 200, h: 50, text: "Склад +10", action: upgradeStoreCapacity, price: () => 500 },
        { x: 260, y: 460, w: 200, h: 50, text: "Зал +5", action: upgradeHallCapacity, price: () => 300 },
        { x: 470, y: 400, w: 200, h: 50, text: "Камера", action: buyCamera, price: () => 200 },
        { x: 470, y: 460, w: 200, h: 50, text: "Ур. маг.", action: upgradeStoreLevel, price: () => 1000 * Math.pow(2, state.storeLevel - 1) },
        { x: 50, y: 520, w: 200, h: 50, text: "Магазин", action: () => switchLocation("shop") }
    ]
};

// Отрисовка
function draw() {
    if (warehouseGame.active || negotiationGame.active) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scaleFactor, scaleFactor);
    console.log("Drawing frame. ScaleFactor:", scaleFactor);

    ctx.fillStyle = "#e0e0e0";
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    ctx.globalAlpha = state.transition.alpha;
    ctx.drawImage(bgCanvas, 0, 0, BASE_WIDTH, BASE_HEIGHT);
    ctx.globalAlpha = 1;

    const panelWidth = 760;
    const panelHeight = 300;
    const panelX = (BASE_WIDTH - panelWidth) / 2;
    const panelY = 20;
    ctx.fillStyle = "#f0f0f0";
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.stroke();

    const lineHeight = 25;
    let y = panelY + lineHeight;
    ctx.fillStyle = "#333";
    ctx.font = "18px Arial";
    ctx.fillText(`День: ${state.day}`, panelX + 10, y); y += lineHeight;
    ctx.fillText(`Деньги: ${state.money}`, panelX + 10, y); y += lineHeight;
    ctx.fillText(`Магазины: ${state.stores}`, panelX + 10, y); y += lineHeight;
    ctx.fillText(`Уровень: ${state.storeLevel}`, panelX + 10, y); y += lineHeight;
    ctx.fillText(`Сотрудники: ${state.employees.length}/${state.storeLevel}`, panelX + 10, y); y += lineHeight;
    ctx.fillText(`Камеры: ${state.cameras}/${state.storeLevel}`, panelX + 10, y); y += lineHeight;
    ctx.fillText(`Еда: ${state.inventory.food.quantity} (Цена: ${state.inventory.food.price}, Опт: ${state.inventory.food.cost}, Срок: ${state.inventory.food.shelfLife})`, panelX + 10, y); y += lineHeight;
    ctx.fillText(`Электроника: ${state.inventory.electronics.quantity} (Цена: ${state.inventory.electronics.price}, Опт: ${state.inventory.electronics.cost}, Срок: ${state.inventory.electronics.shelfLife})`, panelX + 10, y); y += lineHeight;
    ctx.fillText(`Склад: ${Object.values(state.inventory).reduce((sum, i) => sum + i.quantity, 0)}/${state.storeCapacity}`, panelX + 10, y); y += lineHeight;
    ctx.fillText(`Зал: ${state.hallCapacity}`, panelX + 10, y); y += lineHeight;
    ctx.fillText(`Репутация: ${state.reputation}`, panelX + 10, y); y += lineHeight;

    y = panelY + panelHeight + 10;
    ctx.fillStyle = `rgba(51, 51, 51, ${state.messageAlpha})`;
    ctx.fillText(state.message.substring(0, 40), panelX + 10, y);
    state.messageAlpha = Math.max(0, state.messageAlpha - 0.01);

    if (state.tutorialStep > 0 && state.tutorialStep < tutorialMessages.length) {
        y += lineHeight;
        ctx.fillStyle = "#333";
        ctx.fillText(tutorialMessages[state.tutorialStep].substring(0, 40), panelX + 10, y);
    }

    const assistantWidth = Math.max(80, Math.min(BASE_WIDTH * 0.15, 120));
    const assistantHeight = assistantWidth * (297 / 120);
    const assistantX = BASE_WIDTH - assistantWidth - 20;
    const assistantY = 200;
    if (assistantImage.complete && assistantImage.naturalWidth !== 0) {
        ctx.drawImage(assistantImage, assistantX, assistantY, assistantWidth, assistantHeight);
    } else {
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(assistantX, assistantY, assistantWidth, assistantHeight);
        ctx.fillStyle = "#FFF";
        ctx.font = "16px Arial";
        ctx.fillText("Image Error", assistantX + 10, assistantY + assistantHeight / 2);
    }

    const smileSize = 30;
    const smileX = assistantX + assistantWidth / 2 - smileSize / 2;
    const smileY = assistantY - 40;
    let smileImage;
    if (state.customerOpinion >= 75) {
        smileImage = smileGreen;
    } else if (state.customerOpinion >= 50) {
        smileImage = smileYellow;
    } else if (state.customerOpinion >= 25) {
        smileImage = smileOrange;
    } else {
        smileImage = smileRed;
    }
    if (smileImage.complete && smileImage.naturalWidth !== 0) {
        ctx.drawImage(smileImage, smileX, smileY, smileSize, smileSize);
    } else {
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(smileX, smileY, smileSize, smileSize);
        ctx.fillStyle = "#FFF";
        ctx.font = "12px Arial";
        ctx.fillText("Err", smileX + 5, smileY + 20);
    }

    if (state.assistant.message) {
        ctx.font = "14px Arial";
        const text = state.assistant.message;
        const maxWidth = BASE_WIDTH * 0.25;
        const words = text.split(" ");
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + " " + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        const bubbleWidth = Math.min(maxWidth, Math.max(100, lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0) + 20));
        const bubbleHeight = Math.min(100, lines.length * 20 + 10);
        const bubbleX = Math.max(20, assistantX - bubbleWidth - 20);
        const bubbleY = 340;

        ctx.fillStyle = `rgba(255, 255, 255, ${state.assistant.alpha})`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${state.assistant.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = `rgba(33, 150, 243, ${state.assistant.alpha})`;
        lines.forEach((line, index) => {
            ctx.fillText(line, bubbleX + 10, bubbleY + 15 + (index * 20));
        });

        state.assistant.alpha = Math.max(0, state.assistant.alpha - 0.005);
    }

    // Кнопка "Следующий день"
    const nextDayWidth = 180;
    const nextDayHeight = 40;
    const nextDayX = BASE_WIDTH - 180 - 20 - 180 - 20;
    const nextDayY = 20;
    const nextDayHover = mouseX / scaleFactor >= nextDayX && mouseX / scaleFactor <= nextDayX + nextDayWidth && mouseY / scaleFactor >= nextDayY && mouseY / scaleFactor <= nextDayY + nextDayHeight;
    ctx.fillStyle = nextDayHover ? "#FFD54F" : "#FBC02D";
    ctx.beginPath();
    ctx.roundRect(nextDayX, nextDayY, nextDayWidth, nextDayHeight, 5);
    ctx.fill();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = "#333";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Следующий день", nextDayX + nextDayWidth / 2, nextDayY + 28);

    // Кнопка "Сохранить и выйти"
    const exitWidth = 180;
    const exitHeight = 40;
    const exitX = BASE_WIDTH - exitWidth - 20;
    const exitY = 20;
    const exitHover = mouseX / scaleFactor >= exitX && mouseX / scaleFactor <= exitX + exitWidth && mouseY / scaleFactor >= exitY && mouseY / scaleFactor <= exitY + exitHeight;
    ctx.fillStyle = exitHover ? "#FFD54F" : "#FBC02D";
    ctx.beginPath();
    ctx.roundRect(exitX, exitY, exitWidth, exitHeight, 5);
    ctx.fill();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = "#333";
    ctx.fillText("Сохранить и выйти", exitX + exitWidth / 2, exitY + 28);

    // Кнопка "Достижения"
    const achWidth = 180;
    const achHeight = 40;
    const achX = BASE_WIDTH - achWidth - 20;
    const achY = 70;
    const achHover = mouseX / scaleFactor >= achX && mouseX / scaleFactor <= achX + achWidth && mouseY / scaleFactor >= achY && mouseY / scaleFactor <= achY + achHeight;
    ctx.fillStyle = achHover ? "#FFD54F" : "#FBC02D";
    ctx.beginPath();
    ctx.roundRect(achX, achY, achWidth, achHeight, 5);
    ctx.fill();
    ctx.fillStyle = "#333";
    ctx.fillText("Достижения", achX + achWidth / 2, achY + 28);

    // Кнопка "Звук Вкл/Выкл"
    const soundWidth = 180;
    const soundHeight = 40;
    const soundX = BASE_WIDTH - soundWidth - 20;
    const soundY = 120;
    const soundHover = mouseX / scaleFactor >= soundX && mouseX / scaleFactor <= soundX + soundWidth && mouseY / scaleFactor >= soundY && mouseY / scaleFactor <= soundY + soundHeight;
    ctx.fillStyle = soundHover ? "#FFD54F" : "#FBC02D";
    ctx.beginPath();
    ctx.roundRect(soundX, soundY, soundWidth, soundHeight, 5);
    ctx.fill();
    ctx.fillStyle = "#333";
    ctx.fillText(state.soundOn ? "Звук Выкл" : "Звук Вкл", soundX + soundWidth / 2, soundY + 28);

    // Ползунок громкости
    const volumeSliderWidth = 180;
    const volumeSliderHeight = 40;
    const volumeSliderX = BASE_WIDTH - volumeSliderWidth - 20;
    const volumeSliderY = 170; // Под кнопкой "Звук Вкл/Выкл"
    const volumeSlider = document.getElementById("volumeSlider");
    if (volumeSlider) {
        volumeSlider.style.position = "absolute";
        volumeSlider.style.left = `${(volumeSliderX * scaleFactor) / window.devicePixelRatio}px`;
        volumeSlider.style.top = `${(volumeSliderY * scaleFactor) / window.devicePixelRatio}px`;
        volumeSlider.style.width = `${(volumeSliderWidth * scaleFactor) / window.devicePixelRatio}px`;
        volumeSlider.style.transform = `scale(${1 / window.devicePixelRatio})`;
        volumeSlider.style.transformOrigin = "top left";
        volumeSlider.value = state.volume * 100;
    }

    // Кнопки локации
    const currentButtons = locationButtons[state.location];
    currentButtons.forEach(button => {
        const buttonX = button.x;
        const buttonY = button.y;
        const buttonWidth = button.w;
        const buttonHeight = button.h;
        const hover = mouseX / scaleFactor >= buttonX && mouseX / scaleFactor <= buttonX + buttonWidth && mouseY / scaleFactor >= buttonY && mouseY / scaleFactor <= buttonY + buttonHeight;

        ctx.fillStyle = hover ? "#FFD54F" : "#FBC02D";
        ctx.beginPath();
        ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 5);
        ctx.fill();
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = "#333";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(button.text, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 6);

        if (button.price && hover) {
            const price = typeof button.price === "function" ? button.price() : button.price;
            const priceBubbleWidth = 80;
            const priceBubbleHeight = 40;
            const priceBubbleX = buttonX + buttonWidth / 2 - priceBubbleWidth / 2;
            const priceBubbleY = buttonY - priceBubbleHeight - 10;
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(priceBubbleX, priceBubbleY, priceBubbleWidth, priceBubbleHeight, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#333";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(`Цена: ${price}`, priceBubbleX + priceBubbleWidth / 2, priceBubbleY + 25);
        }
    });

    ctx.textAlign = "start";
    ctx.restore();
}

let mouseX = 0;
let mouseY = 0;

canvas.addEventListener("click", function(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX * (canvas.width / rect.width);
    mouseY = event.clientY * (canvas.height / rect.height);
    console.log("Click event at:", mouseX, mouseY);
    handleClick(mouseX, mouseY);
});

canvas.addEventListener("touchstart", function(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouseX = event.touches[0].clientX * (canvas.width / rect.width);
    mouseY = event.touches[0].clientY * (canvas.height / rect.height);
    console.log("Touchstart at:", mouseX, mouseY, "Scaled:", mouseX / scaleFactor, mouseY / scaleFactor);
    handleClick(mouseX, mouseY);
});

function handleClick(x, y) {
    const scaledX = x / scaleFactor;
    const scaledY = y / scaleFactor;
    console.log("Handling click at scaled coordinates:", scaledX, scaledY);

    if (warehouseGame.active) {
        const backX = BASE_WIDTH - 180;
        const backY = 20;
        const backWidth = 160;
        const backHeight = 40;
        if (scaledX >= backX && scaledX <= backX + backWidth && scaledY >= backY && scaledY <= backY + backHeight) {
            console.log("Back button clicked in warehouse game");
            endWarehouseGame(false);
            return;
        }

        warehouseGame.items.forEach(item => {
            if (!item.placed && Math.hypot(scaledX - item.x, scaledY - item.y) < 20) {
                console.log("Item selected:", item.type);
                warehouseGame.selectedItem = item;
            }
        });

        if (warehouseGame.selectedItem) {
            warehouseGame.slots.forEach(slot => {
                if (Math.hypot(scaledX - slot.x, scaledY - slot.y) < 20 && slot.type === warehouseGame.selectedItem.type) {
                    console.log("Slot matched:", slot.type);
                    warehouseGame.selectedItem.placed = true;
                    warehouseGame.selectedItem.x = slot.x;
                    warehouseGame.selectedItem.y = slot.y;
                    warehouseGame.selectedItem = null;
                    if (warehouseGame.items.every(item => item.placed)) {
                        console.log("All items placed, ending game");
                        endWarehouseGame(true);
                    }
                }
            });
        }
    } else if (negotiationGame.active) {
        const backX = BASE_WIDTH - 180;
        const backY = 20;
        const backWidth = 160;
        const backHeight = 40;
        if (scaledX >= backX && scaledX <= backX + backWidth && scaledY >= backY && scaledY <= backY + backHeight) {
            console.log("Back button clicked in negotiation game");
            endNegotiationGame(false);
            return;
        }
        negotiationGame.options.forEach((option, i) => {
            const y = 150 + i * 50;
            if (scaledX >= 50 && scaledX <= 350 && scaledY >= y && scaledY <= y + 40) {
                console.log("Option selected:", option);
                endNegotiationGame(option === negotiationGame.correctAnswer);
            }
        });
    } else {
        const nextDayWidth = 180;
        const nextDayHeight = 40;
        const nextDayX = BASE_WIDTH - 180 - 20 - 180 - 20;
        const nextDayY = 20;
        if (scaledX >= nextDayX && scaledX <= nextDayX + nextDayWidth && scaledY >= nextDayY && scaledY <= nextDayY + nextDayHeight) {
            console.log("Next Day button clicked");
            nextDay();
            return;
        }

        const exitWidth = 180;
        const exitHeight = 40;
        const exitX = BASE_WIDTH - exitWidth - 20;
        const exitY = 20;
        if (scaledX >= exitX && scaledX <= exitX + exitWidth && scaledY >= exitY && scaledY <= exitY + exitHeight) {
            console.log("Save and Exit button clicked");
            saveAndExit();
            return;
        }

        const achWidth = 180;
        const achHeight = 40;
        const achX = BASE_WIDTH - achWidth - 20;
        const achY = 70;
        if (scaledX >= achX && scaledX <= achX + achWidth && scaledY >= achY && scaledY <= achY + achHeight) {
            console.log("Achievements button clicked");
            window.location.href = 'achievements.html';
            return;
        }

        const soundWidth = 180;
        const soundHeight = 40;
        const soundX = BASE_WIDTH - soundWidth - 20;
        const soundY = 120;
        if (scaledX >= soundX && scaledX <= soundX + soundWidth && scaledY >= soundY && scaledY <= soundY + soundHeight) {
            console.log("Sound toggle button clicked");
            toggleSound();
            return;
        }

        locationButtons[state.location].forEach(button => {
            const buttonX = button.x;
            const buttonY = button.y;
            const buttonWidth = button.w;
            const buttonHeight = button.h;
            if (scaledX >= buttonX && scaledX <= buttonX + buttonWidth && scaledY >= buttonY && scaledY <= buttonY + buttonHeight) {
                console.log("Location button clicked:", button.text);
                button.action();
            }
        });
    }
}

canvas.addEventListener("mousemove", function(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX * (canvas.width / rect.width);
    mouseY = event.clientY * (canvas.height / rect.height);
    console.log("Mouse move at:", mouseX, mouseY);

    if (!warehouseGame.active && !negotiationGame.active) {
        locationButtons[state.location].forEach(button => {
            const buttonX = button.x;
            const buttonY = button.y;
            const buttonWidth = button.w;
            const buttonHeight = button.h;
            button.hover = (mouseX / scaleFactor >= buttonX && mouseX / scaleFactor <= buttonX + buttonWidth && mouseY / scaleFactor >= buttonY && mouseY / scaleFactor <= buttonY + buttonHeight);
        });
    }

    if (warehouseGame.active) drawWarehouseGame();
    else if (negotiationGame.active) drawNegotiationGame();
    else draw();
});

let lastFrame = 0;
function gameLoop(timestamp) {
    if (timestamp - lastFrame >= 1000 / 60) {
        updateAssistant(timestamp);
        if (warehouseGame.active) {
            updateWarehouseGame(timestamp);
            drawWarehouseGame();
        } else if (negotiationGame.active) {
            updateNegotiationGame(timestamp);
            drawNegotiationGame();
        } else {
            draw();
        }
        lastFrame = timestamp;
        console.log("Game loop frame rendered. Timestamp:", timestamp);
    }
    requestAnimationFrame(gameLoop);
}

// Обработчик изменения громкости
const volumeSlider = document.getElementById("volumeSlider");
if (volumeSlider) {
    volumeSlider.addEventListener("input", function() {
        const newVolume = volumeSlider.value / 100;
        updateVolume(newVolume);
    });
}

gameLoop(0);
console.log("Game loop started");