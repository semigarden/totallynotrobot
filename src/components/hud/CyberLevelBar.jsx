import React from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

const CyberLevelBar = (props) => {
    const [path0Ref, path2Ref] = useAutoAnimate();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlSpace="preserve"
      width={2300}
      height={691}
      style={{
        shapeRendering: "geometricPrecision",
        textRendering: "geometricPrecision",
        imageRendering: "auto",
        fillRule: "evenodd",
        clipRule: "evenodd",
      }}
      viewBox="0 0 112 34"
      {...props}
    >
      <defs>
        <style>
          {
            ".CyberEl49_svg__fil0,.CyberEl49_svg__fil1{fill:#999;fill-rule:nonzero}.CyberEl49_svg__fil1{fill:#767676}"
          }
        </style>
      </defs>
      <g id="CyberEl49_svg__Vrstva_x0020_1">
        <g id="CyberEl49_svg___2649180555456">
          <path
            ref={path2Ref}
            className="CyberEl49_svg__fil0 path2 animate-mobile-paths"
            d="M33 4h-4v6zM99 10h6l3-6h-6zM91 10h6l4-6h-6zM84 10h6l3-6h-6zM76 10h6l4-6h-7zM68 10h7l3-6h-6zM61 10h6l4-6h-7zM53 10h6l4-6h-6zM46 10h6l3-6h-6zM38 10h6l4-6h-6zM31 10h6l3-6h-6zM24 10h6l4-6h-7zM16 10h6l3-6h-6zM8 10h6l4-6h-7zM1 10h7l3-6h-6zM1 10h7l3-6h-6zM107 10h6l3-6h-6zM115 10h6l4-6h-6zM122 10h6l3-6h-6zM130 10h6l4-6h-7zM138 10h7l3-6h-6zM145 10h6l4-6h-7zM153 10h6l4-6h-6zM160 10h6l3-6h-6zM168 10h6l4-6h-6zM175 10h6l3-6h-6zM183 10h6l4-6h-7zM191 10h6l3-6h-6zM199 10h6l4-6h-7zM207 10h7l3-6h-6zM207 10h7l3-6h-6zM215 10h6l3-6h-6zM223 10h6l4-6h-6zM230 10h6l3-6h-6zM238 10h6l4-6h-7zM246 10h7l3-6h-6zM253 10h6l4-6h-7zM261 10h6l4-6h-6zM268 10h6l3-6h-6zM276 10h6l4-6h-6zM283 10h6l3-6h-6zM291 10h6l4-6h-7zM299 10h6l3-6h-6zM307 10h6l4-6h-7zM315 10h7l3-6h-6zM315 10h7l3-6h-6z"
          />
          {/* <path
            className="CyberEl49_svg__fil1 path3"
            d="M28 11h77l5-8H28v8zm78 2H27V2h85l-6 11z"
          /> */}
        </g>
      </g>
    </svg>
  );
};
export default CyberLevelBar;