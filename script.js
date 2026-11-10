const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const cityName = document.getElementById("cityName");
const dateElement = document.getElementById("date");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const weatherIcon = document.getElementById("weatherIcon");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const feelsLike = document.getElementById("feelsLike");

const errorMessage = document.getElementById("errorMessage");
const forecastContainer = document.getElementById("forecastContainer");

function getWeatherInfo(code) {
    if (code === 0) return ["Clear Sky", "☀️"];
    if (code <= 3) return ["Partly Cloudy", "⛅"];
    if (code <= 48) return ["Foggy", "🌫️"];
    if (code <= 57) return ["Drizzle", "🌦️"];
    if (code <= 67) return ["Rainy", "🌧️"];
    if (code <= 77) return ["Snowy", "❄️"];
    if (code <= 82) return ["Rain Showers", "🌦️"];
    if (code <= 86) return ["Snow Showers", "🌨️"];
    if (code <= 99) return ["Thunderstorm", "⛈️"];

    return ["Unknown", "🌡️"];
}

async function getWeather() {
    const city = cityInput.value.trim();

    if (city === "") {
        errorMessage.textContent = "Please enter a city name.";
        return;
    }

    try {
        errorMessage.textContent = "Loading weather...";
        searchBtn.disabled = true;

        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Please try another city.");
        }

        const location = geoData.results[0];

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
        );

        const weatherData = await weatherResponse.json();

        displayWeather(location, weatherData);

        errorMessage.textContent = "";

    } catch (error) {
        errorMessage.textContent = error.message || "Something went wrong. Please try again.";
    } finally {
        searchBtn.disabled = false;
    }
}

function displayWeather(location, data) {
    const current = data.current;

    cityName.textContent = location.name;
    dateElement.textContent = new Date().toDateString();

    temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
    humidity.textContent = `${current.relative_humidity_2m}%`;
    windSpeed.textContent = `${current.wind_speed_10m} km/h`;
    feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;

    const [weatherDescription, icon] = getWeatherInfo(current.weather_code);

    description.textContent = weatherDescription;
    weatherIcon.textContent = icon;

    displayForecast(data.daily);
}

function displayForecast(daily) {
    forecastContainer.innerHTML = "";

    for (let i = 0; i < daily.time.length; i++) {
        const [dayDescription, icon] = getWeatherInfo(daily.weather_code[i]);

        const forecastDay = document.createElement("div");
        forecastDay.classList.add("forecast-day");

        forecastDay.innerHTML = `
            <p>${new Date(daily.time[i]).toLocaleDateString("en-US", {
                weekday: "short"
            })}</p>
            <div class="forecast-icon">${icon}</div>
            <p>${dayDescription}</p>
            <h3>${Math.round(daily.temperature_2m_max[i])}°C</h3>
            <p>${Math.round(daily.temperature_2m_min[i])}°C</p>
        `;

        forecastContainer.appendChild(forecastDay);
    }
}

searchBtn.addEventListener("click", getWeather);

cityInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        getWeather();
    }
});
// Register the service worker
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .then(() => {
                console.log("Weatherly service worker registered!");
            })
            .catch((error) => {
                console.error("Service worker registration failed:", error);
            });
    });
}