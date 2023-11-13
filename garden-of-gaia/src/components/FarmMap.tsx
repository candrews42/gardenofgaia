// src/components/FarmMap.tsx (or FarmMap.tsx if using TypeScript)

import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';
import Tooltip from '../components/Tooltip';
import { createRoot } from 'react-dom/client';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_API_KEY || "undefined"; // Replace with your Mapbox access token

const FarmMap = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef(new mapboxgl.Popup({ offset: 15 }));
  
    // Initialize map when component mounts
    useEffect(() => {
      if (mapContainerRef.current) {
        
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [26.202712001219915, 50.45865730317095],
            zoom: 15
        });
        
        // change cursor to pointer when user hovers over a clickable feature
        map.on('mouseenter', e => {
            if (e.features.length) {
            map.getCanvas().style.cursor = 'pointer';
            }
        });

        // reset cursor to default when user is no longer hovering over a clickable feature
        map.on('mouseleave', () => {
            map.getCanvas().style.cursor = '';
        });

        // add tooltip when users mouse move over a point
        map.on('mousemove', e => {
            const features = map.queryRenderedFeatures(e.point);
            if (features.length) {
                const feature = features[0];

                // Create tooltip node
                const tooltipNode = document.createElement('div');
                const root = createRoot(tooltipNode); // Create a root.
                root.render(<Tooltip feature={feature} />); // Use root.render() instead of ReactDOM.render()

                // Set tooltip on map
                tooltipRef.current
                    .setLngLat(e.lngLat)
                    .setDOMContent(tooltipNode)
                    .addTo(map);
            }
        });
    
        // Clean up on unmount
        return () => map.remove();
    }}, []); // eslint-disable-line react-hooks/exhaustive-deps
  
    return (
      <div>
        <div className='map-container' ref={mapContainerRef} />
      </div>
    );
  };
  
export default FarmMap;