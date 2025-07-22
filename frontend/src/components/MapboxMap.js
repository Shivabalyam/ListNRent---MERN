import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const MapboxMap = ({ coordinates, location }) => {
  const mapContainer = useRef(null);

  useEffect(() => {
    if (!coordinates) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coordinates,
      zoom: 9,
    });

    new mapboxgl.Marker({ color: 'red' })
      .setLngLat(coordinates)
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>${location}</h3>`))
      .addTo(map);

    return () => map.remove();
  }, [coordinates, location]);

  return <div ref={mapContainer} style={{ height: 400, width: '80vh' }} />;
};

export default MapboxMap; 