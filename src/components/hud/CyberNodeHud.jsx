import React from "react";

const CyberNodeHud = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlSpace="preserve"
      width={120}
      height={40}
      style={{
        shapeRendering: "geometricPrecision",
        textRendering: "geometricPrecision",
        imageRendering: "auto",
        fillRule: "evenodd",
        clipRule: "evenodd",
      }}
      viewBox="0 0 120 40"
      {...props}
    >
      <defs>
        <style>
          {
            ".CyberNode_svg__fil0{fill:#f0265e!important;},.CyberNode_svg__fil1{fill:#252626;fill-rule:nonzero}"
          }
        </style>
      </defs>
      <g id="CyberNode_svg__Vrstva_x0020_1">
        <g id="CyberNode_svg___2649180488864">
          {/* Main node body */}
          <path
            className="CyberNode_svg__fil0 path0"
            d="M10 0h100v30H10z"
          />
          {/* Top border accent */}
          <path
            className="CyberNode_svg__fil1 path1"
            d="M10 0h100v2H10z"
          />
          {/* Bottom border accent */}
          <path
            className="CyberNode_svg__fil1 path2"
            d="M10 28h100v2H10z"
          />
          {/* Left border accent */}
          <path
            className="CyberNode_svg__fil1 path3"
            d="M10 0v30h2V0z"
          />
          {/* Right border accent */}
          <path
            className="CyberNode_svg__fil1 path4"
            d="M108 0v30h2V0z"
          />
          {/* Corner accents */}
          <path
            className="CyberNode_svg__fil1 path5"
            d="M8 0h4v4H8z"
          />
          <path
            className="CyberNode_svg__fil1 path6"
            d="M108 0h4v4h-4z"
          />
          <path
            className="CyberNode_svg__fil1 path7"
            d="M8 26h4v4H8z"
          />
          <path
            className="CyberNode_svg__fil1 path8"
            d="M108 26h4v4h-4z"
          />
          {/* Connector base */}
          <path
            className="CyberNode_svg__fil0 path9"
            d="M55 30h10v10H55z"
          />
        </g>
      </g>
    </svg>
  );
};

export default CyberNodeHud; 