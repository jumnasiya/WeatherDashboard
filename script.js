
const API_KEY = "c465d0760a40a7af0ac29f8093ad10b3";

let currentCity = "";

//  Get weather from API
async function getWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message);
    }

    return data;
}

//  Search weather
async function searchWeather(city) {
    city = city.trim();

    if (!city) {
        errorMsg.textContent = "Enter a city name";
        return;
    }

    loader.hidden = false;
    errorMsg.textContent = "";
    weatherCard.hidden = true;

    try {
        const data = await getWeather(city);

        currentCity = data.name;

        document.getElementById("location").textContent = data.name;
        document.getElementById("temperature").textContent =
            Math.round(data.main.temp) + "°C";
        document.getElementById("description").textContent =
            data.weather[0].description;
        document.getElementById("feelsLike").textContent =
            Math.round(data.main.feels_like) + "°C";
        document.getElementById("humidity").textContent =
            data.main.humidity + "%";
        document.getElementById("wind").textContent =
            data.wind.speed + " m/s";

        document.getElementById("weatherIcon").src =
            `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

        weatherCard.hidden = false;
        updateFavoriteButton();

        // Get 5-day forecast
        await getForecast(city);

    } catch (error) {
        errorMsg.textContent = "Error: " + error.message;
    } finally {
        loader.hidden = true;
    }
}

//  Get 5-day forecast
async function getForecast(city) {
    const url =
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message);
    }

    const forecast = document.getElementById("forecast");
    forecast.innerHTML = "";

    const days = {};

    data.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];

        if (!days[date] || item.dt_txt.includes("12:00:00")) {
            days[date] = item;
        }
    });

    Object.values(days).slice(0, 5).forEach(item => {
        const card = document.createElement("div");
        card.className = "day-card";

        card.innerHTML = `
            <p>${item.dt_txt.split(" ")[0]}</p>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="Weather">
            <h3>${Math.round(item.main.temp)}°C</h3>
            <p>${item.weather[0].description}</p>
        `;

        forecast.appendChild(card);
    });
}

// Add favorite
function addFavorite(city) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    if (favorites.includes(city)) {
        return;
    }

    favorites.push(city);
    localStorage.setItem("favorites", JSON.stringify(favorites));

    loadFavorites();
    updateFavoriteButton();
}

//  Remove favorite
function removeFavorite(city) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    favorites = favorites.filter(item => item !== city);

    localStorage.setItem("favorites", JSON.stringify(favorites));

    loadFavorites();
    updateFavoriteButton();
}

// Show favorites

async function loadFavorites() {
    const favorites = JSON.parse(
        localStorage.getItem("favorites")
    ) || [];

    const list = document.getElementById("favoritesList");
    list.innerHTML = "";

    if (favorites.length === 0) {
        list.textContent = "No favorite cities yet.";
        return;
    }

    for (const city of favorites) {
        const item = document.createElement("div");
        item.className = "favorite";

        const name = document.createElement("span");
        name.textContent = city + " - Loading weather...";

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.className = "remove";

        removeBtn.onclick = () => removeFavorite(city);

        item.append(name, removeBtn);
        list.appendChild(item);

        try {
            const data = await getWeather(city);

            name.textContent =
                `${data.name}: ${Math.round(data.main.temp)}°C, ` +
                `${data.weather[0].description}`;
        } catch (error) {
            name.textContent = `${city}: Weather unavailable`;
        }

        name.style.cursor = "pointer";
        name.onclick = () => searchWeather(city);
    }
}


// Update favorite button
function updateFavoriteButton() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    const exists = favorites.includes(currentCity);

    document.getElementById("favoriteBtn").textContent =
        exists ? "♥ Remove from favorites" : "♡ Add to favorites";
}

// Search button
document.getElementById("searchForm").addEventListener("submit", event => {
    event.preventDefault();
    searchWeather(document.getElementById("cityInput").value);
});

// Favorite button
document.getElementById("favoriteBtn").addEventListener("click", () => {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    if (favorites.includes(currentCity)) {
        removeFavorite(currentCity);
    } else if (currentCity) {
        addFavorite(currentCity);
    }
});

// Dark / light theme
document.getElementById("themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const dark = document.body.classList.contains("dark");

    document.getElementById("themeBtn").textContent =
        dark ? "☀ Light" : "🌙 Dark";

    localStorage.setItem("theme", dark ? "dark" : "light");
});

//  Load saved data when page opens
document.addEventListener("DOMContentLoaded", () => {
    loadFavorites();

    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
        document.getElementById("themeBtn").textContent = "☀ Light";
    }
});
