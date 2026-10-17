"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, LoaderCircle, RefreshCw, Sun, Wind } from "lucide-react";

type WeatherDay = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
};

type WeatherPlace = {
  id: string;
  name: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: WeatherDay;
};

type WeatherResponse = { places: WeatherPlace[]; provider: string; retrievedAt: string };

function describeWeather(code: number) {
  if (code === 0) return { label: "Clear sky", Icon: Sun };
  if ([1, 2].includes(code)) return { label: "Partly cloudy", Icon: CloudSun };
  if (code === 3) return { label: "Overcast", Icon: Cloud };
  if ([45, 48].includes(code)) return { label: "Fog", Icon: CloudFog };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Drizzle", Icon: CloudRain };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Rain showers", Icon: CloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snow", Icon: CloudSnow };
  if ([95, 96, 99].includes(code)) return { label: "Thunderstorm", Icon: CloudLightning };
  return { label: "Weather update", Icon: Wind };
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-PK", { weekday: "short", timeZone: "Asia/Karachi" }).format(new Date(`${value}T12:00:00+05:00`));
}

export function RegionalWeather() {
  const [forecast, setForecast] = useState<WeatherResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadWeather() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/weather", { signal: controller.signal, cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Forecasts are temporarily unavailable.");
        setForecast(payload as WeatherResponse);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Forecasts are temporarily unavailable.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadWeather();
    return () => controller.abort();
  }, [refreshCount]);

  return (
    <div className="weather-widget" aria-live="polite">
      <div className="weather-widget-top">
        <div><span className="eyebrow"><span className="eyebrow-dot" /> MODELLED REGIONAL CONDITIONS</span><p>Quick planning conditions for selected valley hubs.</p></div>
        <button className="weather-refresh" type="button" onClick={() => setRefreshCount((count) => count + 1)} disabled={loading} aria-label="Refresh forecasts">
          {loading ? <LoaderCircle className="spin" size={17} /> : <RefreshCw size={16} />}
          <span>{loading ? "Updating" : "Refresh"}</span>
        </button>
      </div>
      {error && <div className="weather-error" role="alert"><p>{error} Check the official weather page for the latest district reports.</p><a href="https://e-tourism.visitgilgitbaltistan.gov.pk/plan-trip/weather" target="_blank" rel="noreferrer">Open official weather <span aria-hidden="true">↗</span></a></div>}
      {loading && !forecast && <div className="weather-loading"><LoaderCircle className="spin" size={20} /> Loading current conditions…</div>}
      {forecast && <div className="weather-grid">
        {forecast.places.map((place) => {
          const current = describeWeather(place.current.weather_code);
          const Icon = current.Icon;
          return <article className="weather-card" key={place.id}>
            <div className="weather-card-head"><h3>{place.name}</h3><Icon size={22} aria-hidden="true" /></div>
            <strong className="weather-temperature">{Math.round(place.current.temperature_2m)}<span>°C</span></strong>
            <span className="weather-condition">{current.label} · feels {Math.round(place.current.apparent_temperature)}°</span>
            <div className="weather-card-stats"><span>Humidity <b>{Math.round(place.current.relative_humidity_2m)}%</b></span><span>Wind <b>{Math.round(place.current.wind_speed_10m)} km/h</b></span></div>
            <div className="weather-three-day">{place.daily.time.slice(0, 3).map((day, index) => <span key={day}><small>{index === 0 ? "Today" : formatDay(day)}</small><b>{Math.round(place.daily.temperature_2m_max[index])}° / {Math.round(place.daily.temperature_2m_min[index])}°</b></span>)}</div>
          </article>;
        })}
      </div>}
      {forecast && <p className="weather-attribution">Forecast model: {forecast.provider} · Retrieved {new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(forecast.retrievedAt))}. Valley conditions can change quickly; this is not a road, rescue or official safety advisory.</p>}
    </div>
  );
}
