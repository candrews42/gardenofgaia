import React from "react";

interface TooltipProps {
    feature: any;
}

const Tooltip: React.FC<TooltipProps> = ({ feature }) => {
    const { id } = feature.properties;  // Assuming 'properties' and 'id' exist on 'feature'  

  return (
    <div id={`tooltip-${id}`}>
      <strong>Source Layer:</strong> {feature.layer["source-layer"]}
      <br />
      <strong>Layer ID:</strong> {feature.layer.id}
    </div>
  );
};

export default Tooltip;