
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");

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
const hourlyContainer = document.getElementById("hourlyContainer");

// Get weather description and icon
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

// Fetch weather using latitude and longitude
async function fetchWeather(latitude, longitude, name) {
    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
        `&hourly=temperature_2m,precipitation_probability,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&timezone=auto&forecast_days=5`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to fetch weather data.");
    }

    const data = await response.json();

    displayWeather(name, data);
}

// Search for a city
async function getWeather() {
    const city = cityInput.value.trim();

    if (city === "") {
        errorMessage.textContent = "Please enter a city name.";
        return;
    }

    try {
        errorMessage.textContent = "Loading weather...";
        searchBtn.disabled = true;
        locationBtn.disabled = true;

        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        if (!geoResponse.ok) {
            throw new Error("Unable to find this city.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Please try another city.");
        }

        const location = geoData.results[0];

        await fetchWeather(
            location.latitude,
            location.longitude,
            location.name
        );

        errorMessage.textContent = "";

    } catch (error) {
        errorMessage.textContent = error.message || "Something went wrong.";
    } finally {
        searchBtn.disabled = false;
        locationBtn.disabled = false;
    }
}

// Detect the device's current location
function getMyLocation() {
    if (!navigator.geolocation) {
        errorMessage.textContent =
            "Location detection is not supported by your browser.";
        return;
    }

    errorMessage.textContent = "Detecting your location...";

    searchBtn.disabled = true;
    locationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        async function(position) {
            try {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                await fetchWeather(
                    latitude,
                    longitude,
                    "Your Location"
                );

                errorMessage.textContent = "";

            } catch (error) {
                errorMessage.textContent =
                    error.message || "Unable to fetch local weather.";
            } finally {
                searchBtn.disabled = false;
                locationBtn.disabled = false;
            }
        },

        function(error) {
            if (error.code === 1) {
                errorMessage.textContent =
                    "Location permission denied. Please allow location access.";
            } else if (error.code === 2) {
                errorMessage.textContent =
                    "Your location is currently unavailable.";
            } else {
                errorMessage.textContent =
                    "Location request timed out. Please try again.";
            }

            searchBtn.disabled = false;
            locationBtn.disabled = false;
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }
    );
}

// Display current weather
function displayWeather(name, data) {
    const current = data.current;

    cityName.textContent = name;
    dateElement.textContent = new Date().toDateString();

    temperature.textContent =
        `${Math.round(current.temperature_2m)}°C`;

    humidity.textContent =
        `${current.relative_humidity_2m}%`;

    windSpeed.textContent =
        `${current.wind_speed_10m} km/h`;

    feelsLike.textContent =
        `${Math.round(current.apparent_temperature)}°C`;

    const [weatherDescription, icon] =
        getWeatherInfo(current.weather_code);

    description.textContent = weatherDescription;
    weatherIcon.textContent = icon;

    displayHourlyForecast(data.hourly, current.time);
    displayForecast(data.daily);
}

// Convert API time into a readable 12-hour format
function formatHour(timeString) {
    const hour = Number(timeString.slice(11, 13));
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour} ${suffix}`;
}

// Display the next 24 hours
function displayHourlyForecast(hourly, currentTime) {
    hourlyContainer.innerHTML = "";

    let startIndex = hourly.time.indexOf(currentTime);

    if (startIndex === -1) {
        startIndex = hourly.time.findIndex(
            time => time >= currentTime
        );
    }

    if (startIndex === -1) {
        startIndex = 0;
    }

    const endIndex = Math.min(
        startIndex + 24,
        hourly.time.length
    );

    for (let i = startIndex; i < endIndex; i++) {
        const [weatherDescription, icon] =
            getWeatherInfo(hourly.weather_code[i]);

        const rainChance =
            hourly.precipitation_probability[i] ?? 0;

        const card = document.createElement("div");
        card.classList.add("hourly-card");

        card.innerHTML = `
            <p>${formatHour(hourly.time[i])}</p>
            <div class="hourly-icon">${icon}</div>
            <h3>${Math.round(hourly.temperature_2m[i])}°C</h3>
            <p>${weatherDescription}</p>
            <p class="rain-chance">💧 ${rainChance}% rain</p>
        `;

        hourlyContainer.appendChild(card);
    }
}

// Display the 5-day forecast
function displayForecast(daily) {
    forecastContainer.innerHTML = "";

    for (let i = 0; i < daily.time.length; i++) {
        const [dayDescription, icon] =
            getWeatherInfo(daily.weather_code[i]);

        const forecastDay = document.createElement("div");
        forecastDay.classList.add("forecast-day");

        forecastDay.innerHTML = `
            <p>${new Date(daily.time[i]).toLocaleDateString(
                "en-US",
                { weekday: "short", timeZone: "UTC" }
            )}</p>
            <div class="forecast-icon">${icon}</div>
            <p>${dayDescription}</p>
            <h3>${Math.round(daily.temperature_2m_max[i])}°C</h3>
            <p>${Math.round(daily.temperature_2m_min[i])}°C</p>
        `;

        forecastContainer.appendChild(forecastDay);
    }
}

// Button events
searchBtn.addEventListener("click", getWeather);
locationBtn.addEventListener("click", getMyLocation);

cityInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        getWeather();
    }
});

// Register service worker
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
