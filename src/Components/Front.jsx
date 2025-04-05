import React, { useState, useEffect } from "react";
import {
  TextField,
  Autocomplete,
  Card,
  CardContent,
  Typography,
  Grid,
} from "@mui/material";
import axios from "axios";
import logo from "../Images/logo.svg";
import cloud from "../Images/cloud.svg";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import day from "../Images/day.svg";
import night from "../Images/night.svg";

const API_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

const WeatherApp = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [history, setHistory] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [isWeatherVisible, setIsWeatherVisible] = useState(false);
  const [expandedCityId, setExpandedCityId] = useState(null); // Laikys išskleisto miesto ID // Būsena orų informacijos matomumui

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem("cityHistory")) || [];
    setHistory(storedHistory);
  }, []);

  const fetchWeather = async (city) => {
    if (!city || !city.latitude || !city.longitude) return;

    try {
      const response = await axios.get(
        `${WEATHER_API_URL}?latitude=${city.latitude}&longitude=${city.longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max&timezone=auto`
      );

      if (response.data) {
        setWeatherData(response.data.current_weather);
        setForecast(response.data.daily);
        updateHistory(city);
        await axios.post("http://localhost:5000/log", {
          city: city.name,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error fetching weather data", error);
    }
  };

  const getFormattedDate = (dateString) => {
    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
    const formatted = date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
    });
    return { dayOfWeek, formatted };
  };

  const updateHistory = (city) => {
    const updatedHistory = [
      city,
      ...history.filter((c) => c.name !== city.name),
    ].slice(0, 3);
    setHistory(updatedHistory);
    localStorage.setItem("cityHistory", JSON.stringify(updatedHistory));
  };

  const fetchCities = async (query) => {
    if (!query) return;
    try {
      const response = await axios.get(`${API_URL}?name=${query}&count=10`);
      if (response.data && response.data.results) {
        const uniqueCities = Array.from(
          new Map(
            response.data.results.map((city) => [city.name, city])
          ).values()
        ).slice(0, 3);

        setCityOptions(uniqueCities);
      } else {
        setCityOptions([]);
      }
    } catch (error) {
      console.error("Error fetching city data", error);
      setCityOptions([]);
    }
  };

  return (
    <div
      style={{
        display: "inline-flex",
        paddingBottom: "53px",
        flexDirection: "column",
        alignItems: "center",
        gap: "46px",
        background: "#F8FFF5",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "360px",
          padding: "16px",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div>
          <img
            src={logo}
            alt="LOGO"
            style={{ width: 166, height: 46, aspectratio: 83 / 23 }}
          />
        </div>
        <Autocomplete
          style={{
            display: "flex",
            height: "48px",
            padding: "12PX 16px",
            justifyContent: "center",
            alignitems: "center",
            alignSelf: "stretch",
            gap: "16px",
          }}
          options={[...history, ...cityOptions]}
          getOptionLabel={(option) => option.name || "Unknown"}
          onInputChange={(event, value) => fetchCities(value)}
          onChange={(event, newValue) => {
            setSelectedCity(newValue);
            fetchWeather(newValue);
            setIsWeatherVisible(true); // Rodyti orų informaciją pasirinkus per autocomplete
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search City"
              variant="outlined"
              fullWidth
            />
          )}
          renderOption={(props, option) => (
            <li
              {...props}
              key={option.name + option.latitude + option.longitude}
            >
              {option.name}
            </li>
          )}
        />
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Typography
            variant="h6"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "328px",
              gap: "24px",
            }}
          >
            Mostly viewed cities:
          </Typography>
          <Grid
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              alignSelf: "stretch",
              borderRadius: "6px",
              border: "1px solid #DFDFDF",
              background: "#FFF",
              boxShadow: "0px 4px 8px 0px rgba(0, 0, 0, 0.04)",
            }}
            container
            spacing={2}
          >
            {history.map((city) => (
              <Grid item key={city.name + city.latitude + city.longitude}>
                <Typography
                  onClick={() => {
                    if (expandedCityId === city.name) {
                      setExpandedCityId(null); // Uždaryti, jei jau atidarytas
                    } else {
                      setExpandedCityId(city.name); // Atidaryti paspaustą
                      setSelectedCity(city);
                      fetchWeather(city);
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    color: "#1976d2",
                    textDecoration: "underline",
                    display: "flex",
                    padding: "16px",
                    width: "328px",
                    alignItems: "center",
                    gap: "10px",
                    alignSelf: "stretch",
                    borderBottom: "1px solid #DFDFDF",
                    "&:hover": {
                      backgroundColor: "#F0F0F0",
                    },
                  }}
                >
                  <ArrowForwardIosIcon
                    style={{
                      transform:
                        expandedCityId === city.name
                          ? "rotate(90deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.2s ease-in-out",
                    }}
                  />
                  {city.name}
                </Typography>
                {expandedCityId === city.name && (
                  <div
                    style={{
                      paddingLeft: 20,
                      marginTop: 5,
                      borderLeft: "1px solid #ccc",
                    }}
                  >
                    {/* Čia galėtų būti rodoma papildoma informacija apie miestą */}
                    {weatherData &&
                      selectedCity &&
                      selectedCity.name === city.name && (
                        <div>
                          <Typography
                            variant="subtitle2"
                            style={{
                              display: "flex",
                              padding: "12px 16px",
                              alignItems: "center",
                              gap: "12px",
                              alignSelf: "stretch",
                            }}
                          >
                            <img src={cloud} alt="Cloud" />
                            <Typography
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "flex-start",
                                gap: "6px",
                                flex: "1 0 0",
                                alignSelf: "stretch",
                                width: "92px",
                                color: "#000",
                                fontFamily: "Inter",
                                fontSize: "36px",
                                fontStyle: "normal",
                                fontWeight: "600",
                                lineHeight: "normal",
                              }}
                            >
                              {weatherData.temperature}
                              <Typography>Cloudy with sun</Typography>
                              <Typography style={{ color: "#737373" }}>
                                Feels like : {weatherData.temperature}°C
                              </Typography>
                            </Typography>
                          </Typography>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              alignSelf: "stretch",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                width: "125px",
                                padding: "12px 16px",
                                alignItems: "center",
                                gap: "10px",
                                borderTop: "1px solid #ECECEC",
                                borderBottom: "1px solid #ECECEC",
                                borderLeft: "1px solid #ECECEC",
                              }}
                            >
                              Wind speed
                            </div>
                            <div
                              style={{
                                display: "flex",
                                padding: "12px 16px",
                                alignItems: "center",
                                gap: "10px",
                                flex: "1 0 0",
                                border: "1px solid #ECECEC",
                              }}
                            >
                              {weatherData.windspeed} km/h
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              alignSelf: "stretch",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                width: "125px",
                                padding: "12px 16px",
                                alignItems: "center",
                                gap: "10px",
                                borderTop: "1px solid #ECECEC",
                                borderBottom: "1px solid #ECECEC",
                                borderLeft: "1px solid #ECECEC",
                              }}
                            >
                              Wind gust
                            </div>
                            <div
                              style={{
                                display: "flex",
                                padding: "12px 16px",
                                alignItems: "center",
                                gap: "10px",
                                flex: "1 0 0",
                                border: "1px solid #ECECEC",
                              }}
                            >
                              {weatherData.windGust} m/s
                            </div>
                          </div>
                          <Typography variant="subtitle3">
                            Temperature: {weatherData.temperature}°C
                          </Typography>
                          {/* ... kita orų informacija, kurią norite čia rodyti ... */}
                        </div>
                      )}
                    {forecast.length !== 0 && (
                      <Card style={{ marginTop: 20 }}>
                        <CardContent>
                          <Typography
                            variant="h6"
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              alignSelf: "stretch",
                            }}
                          >
                            5-Day Forecast
                          </Typography>
                          <Grid container spacing={2}>
                            {forecast.time.slice(0, 5).map((date, idx) => {
                              const { dayOfWeek, formatted } =
                                getFormattedDate(date);
                              return (
                                <Grid
                                  item
                                  size={{ xs: 12, sm: 6, md: 4 }}
                                  key={idx}
                                >
                                  <Card variant="outlined">
                                    <CardContent
                                      style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        alignSelf: "stretch",
                                      }}
                                    >
                                      <Typography
                                        style={{
                                          display: "flex",
                                          width: "125pX",
                                          padding: "12px 16px",
                                          flexDirection: "column",
                                          justifyContent: "center",
                                          alignItems: "flex-start",
                                          gap: "4px",
                                          alignSelf: "stretch",
                                          borderBottom: "1px solid #ECECEC",
                                          borderLeft: "1px solid #ECECEC",
                                        }}
                                      >
                                        <Typography
                                          style={{
                                            width: "92px",
                                            color: "#000",
                                            fontFamily: "Inter",
                                            fontSize: "14px",
                                            fontStyle: "normal",
                                            fontWeight: "500",
                                            lineHeight: "normal",
                                          }}
                                        >
                                          {dayOfWeek}
                                        </Typography>
                                        <Typography
                                          style={{
                                            width: "92px",
                                            color: "#737373",
                                            fontFamily: "Inter",
                                            fontSize: "12px",
                                            fontStyle: "normal",
                                            fontWeight: "400",
                                            lineHeight: "normal",
                                          }}
                                        >
                                          {formatted}
                                        </Typography>
                                      </Typography>
                                      <Typography
                                        style={{
                                          display: "flex",
                                          padding: "12px 16px",
                                          alignItems: "center",
                                          gap: "6px",
                                          flex: "1 0 0",
                                          alignSelf: "stretch",
                                          borderBottom: "1px solid #ECECEC",
                                          borderLeft: "1px solid #ECECEC",
                                          background: "#F8FFDB",
                                        }}
                                      >
                                        <img src={day} alt="day" />
                                        {forecast.temperature_2m_max[idx]}
                                        °C
                                      </Typography>
                                      <Typography
                                        style={{
                                          display: "flex",
                                          padding: "12px 16px",
                                          alignItems: "center",
                                          gap: "6px",
                                          flex: "1 0 0",
                                          alignSelf: "stretch",
                                          borderBottom: "1px solid #ECECEC",
                                          borderLeft: "1px solid #ECECEC",
                                          background: "#DBDFFF",
                                        }}
                                      >
                                        <img src={night} alt="night" />
                                        {forecast.temperature_2m_min[idx]}°C
                                      </Typography>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              );
                            })}
                          </Grid>
                        </CardContent>
                      </Card>
                    )}
                    {!weatherData &&
                      selectedCity &&
                      selectedCity.name === city.name && (
                        <Typography variant="caption">
                          Loading weather...
                        </Typography>
                      )}
                  </div>
                )}
              </Grid>
            ))}
          </Grid>
        </div>
      )}
    </div>
  );
};

export default WeatherApp;
