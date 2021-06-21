// Elements
var inputCity = document.querySelector("#input-city");
var currentButton = document.querySelector("#show-current");

// constants
const api_key = "//your api key";
const geocode_api_key = "//your api key";
const api_url = "https://api.openweathermap.org/data/2.5/onecall?";
const city_url = "https://api.openweathermap.org/data/2.5/weather?";
const reverse_geocode_url =
  "https://open.mapquestapi.com/geocoding/v1/reverse?";

// firebase config
const firebaseConfig = {
  // your config
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// default location delhi
const default_loc = {
  "input-city": "Delhi",
  lat: 28.6667,
  lon: 77.2167,
};

// storage obj
var weather = {};

// --------------------------------event listeners-------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  $(".weather").css({ display: "none" });
});

currentButton.addEventListener("click", getCurrentLocation);

$("#input-city").keypress(function (event) {
  var keycode = event.keyCode ? event.keyCode : event.which;
  if (keycode == "13") {
    var city = inputCity.value;

    if (city !== "") {
      getCoords(city)
        .then((coord) => {
          getWeather(coord.lat, coord.lon);
        })
        .catch((err) => {
          console.log(err.message);
        });
    } else {
      return;
    }
  }
});

// -------------------------------------functions--------------------------------------
function getCurrentDateTime() {
  let d = new Date();
  return d.toUTCString();
}

function convertTime(dt) {
  let utcSeconds = dt;
  let d = new Date(0);
  let ampm = "am";
  d.setUTCSeconds(utcSeconds);
  let h = d.getHours();
  if (h >= 12) {
    if (h > 12) h -= 12;
    ampm = "pm";
  }
  return h + " " + ampm;
}

function convertDate(dt) {
  let utcSeconds = dt;
  let d = new Date(0);
  d.setUTCSeconds(utcSeconds);
  return d.toDateString();
}

function getCurrentLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        getReverseGeocode(position.coords.latitude, position.coords.longitude)
          .then((loc) => {
            if (loc) weather["input-city"] = loc;
            else weather["input-city"] = "Current Location";
          })
          .finally(() => {
            getWeather(position.coords.latitude, position.coords.longitude);
          });
      },
      (err) => {
        console.log(err.message);
        showToast();
        weather["input-city"] = default_loc["input-city"];
        getWeather(default_loc.lat, default_loc.lon);
      }
    );
  } else {
    console.log("your browser doesn't support geolocation.");
    weather["input-city"] = default_loc["input-city"];
    getWeather(default_loc.lat, default_loc.lon);
  }
}

function displayWeather(data) {
  //general info
  $(".city-info ul").append(`<li>${data["current-datetime"]}</li>`);
  $(".city-info ul").append(
    `<li><h4 id='disp-city'>${data["input-city"]}</h4></li>`
  );

  //current weather
  $(".current-weather ul").append(
    `<li>
        <div class='row'>
            <div class='col-6'>Day ${data.daily[0].temp.max}°<br>Night ${data.daily[0].temp.min}°</div>
        </div>
        <div class='row'>
            <div class='col' id='disp-temp-div'><h2 id='disp-temp'>${data.current.temp} °C</h2> </div>
            <div class='col' id='disp-img-div'><img id='disp-img' src="res/icons/${data.current.weather[0].icon}@2x.png"> </div>
        </div>
        <div class='row'>
            <div class='col'>Feels like ${data.current.feels_like}°</div>
            <div class='col'>${data.current.weather[0].main}</div>
        </div>
    </li>`
  );

  // display graph
  $(".current-hourly").append(`<h4 class='disp-sub'>Hourly Weather</h4>`);
  displayGraph1(data.hourly);

  // current details
  $(".current-details").append(
    `<div>
        <div class="row">
            <div class='col'><h4 class='disp-sub'>Current Details</h4></div>
        </div>
        <div class="row">
                    <div class="col">Humidity<br>Dew point<br>Pressure<br>UV Index<br>Visibility<br>Wind Speed</div>
                    <div class="col">${data.current.humidity}%<br>${
      data.current.dew_point
    }°C<br>${data.current.pressure}mBar<br>${data.current.uvi}<br>${Math.round(
      data.current.visibility / 1000
    )}km<br>${data.current.wind_speed}km/h</div>
        </div>
     </div>`
  );

  // daily forecast
  $(".daily-weather ul").append(
    `<h4 class='disp-sub'>Daily Forecast (7 days)</h4>`
  );
  displayForecast(data.daily);
}

function displayGraph1(data) {
  anychart.theme(anychart.themes.darkBlue);

  var chart = anychart.area();
  chart.title("Hourly Weather");

  let mydata = [];
  for (i = 0; i < 24; i++) {
    let a = convertTime(data[i].dt);
    let b = data[i].temp;
    mydata.push([a, b]);
  }

  chart.area(mydata);

  var ticks = chart.yScale().ticks();
  ticks.interval(2);

  // set y axis title
  var yAxis0 = chart.yAxis(0);
  yAxis0.title("Celsius");

  // adjust additional axis
  var yAxis1 = chart.yAxis(1);
  yAxis1.orientation("right");
  yAxis1.title("Farenheit");

  // set function to format y axis labels
  var yLabels = chart.yAxis(0).labels();
  yLabels.format("{%value}°");

  // formats labels of additional axis
  var yLabels1 = chart.yAxis(1).labels();
  yLabels1.format(function () {
    var value = this.value;
    value = Math.round((value * 9) / 5 + 32);
    return value + "°";
  });

  var xAxis = chart.xAxis();
  xAxis.title("Time");

  chart.container("current-hourly");
  chart.draw();
}

function displayForecast(data) {
  for (i = 0; i < 8; i++) {
    $(".daily-weather ul").append(
      `<li>
            <div class='template'>
                <div class="row">
                    <div class="col-6 row-margin">
                      <div class='row'><div class='col weather-dt'>${convertDate(
                        data[i].dt
                      )}</div></div>
                      <div class='row'><div class='col weather-desc'>${
                        data[i].weather[0].description
                      }</div></div>
                    </div>
                    <div class="col-6">
                    <div class='row'><div class='col-6'>
                        <img src="res/icons/${
                          data[i].weather[0].icon
                        }@2x.png" alt="">
                      </div>
                    <div class='col-6 row-margin left-align'>
                    <div class='row'><div class='col'>${
                      data[i].temp.max
                    }°</div></div>
                    <div class='row'><div class='col'>${
                      data[i].temp.min
                    }°</div></div>
      </div>
      </div>
                </div>
                <div class="row">
                    <div class="col">Wind Speed<br>Humidity<br>Pressure<br>Uv Index</div>
                    <div class="col">${data[i].wind_speed}km/h<br>${
        data[i].humidity
      }%<br>${data[i].pressure}mBar<br>${data[i].uvi}</div>
                </div>
                <div class="row">
                    <div class="col">
            </div><hr>
        </li>`
    );
  }
}

function resetWeather() {
  inputCity.value = "";
  $(".weather").css({ display: "block" });
  $(".city-info ul").empty();
  $(".current-hourly").empty();
  $(".current-weather ul").empty();
  $(".current-details").empty();
  $(".daily-weather ul").empty();
}

async function getWeather(lat, lon) {
  await fetch(api_url + `lat=${lat}&lon=${lon}&units=metric&appid=` + api_key)
    .then((response) => response.json(), fetchErrorHandler)
    .then((data) => {
      if (data.cod != 200) {
        // get weather data
        weather["current-datetime"] = getCurrentDateTime();
        weather.lat = lat;
        weather.lon = lon;
        weather.current = data.current;
        weather.hourly = data.hourly;
        weather.daily = data.daily;
      } else {
        console.log("getWeather_error: " + data.message);
      }
    })
    .then(() => {
      resetWeather();
      displayWeather(weather);
    })
    .catch((err) => console.log(err.message));
}

async function getReverseGeocode(lat, lon) {
  let loc = "";
  await fetch(
    reverse_geocode_url +
      `key=${geocode_api_key}&location=${lat},${lon}&outFormat=json`
  )
    .then((response) => response.json(), fetchErrorHandler)
    .then((data) => {
      let res = data.results[0].locations[0];
      loc +=
        res["adminArea5"] +
        (res["adminArea4"] ? ", " + res["adminArea4"] : "") +
        (res["adminArea1"] ? ", " + res["adminArea1"] : "");
    })
    .catch((err) => {
      console.log("mapQuest_error: " + err.message);
    });

  return loc;
}

async function getCoords(city) {
  let coord = {};
  await fetch(city_url + `q=${city}&appid=` + api_key)
    .then((response) => response.json(), fetchErrorHandler)
    .then((data) => {
      if (data.coord) {
        coord = data.coord;
        weather["input-city"] = city;
      } else {
        console.log("GetCoords_error: " + data.message);
        showToast();
        coord.lat = default_loc.lat;
        coord.lon = default_loc.lon;
        weather["input-city"] = default_loc["input-city"];
      }
    })
    .catch((err) => console.log(err.message));

  return coord;
}

function fetchErrorHandler() {
  throw new Error("Error handler: Coulnd't Fetch the weather api");
}

function showToast() {
  $(".toast").toast("show");
}
