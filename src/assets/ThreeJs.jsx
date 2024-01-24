import { library } from '@fortawesome/fontawesome-svg-core';

export const faThreeJs = {
        prefix: 'fab',
        iconName: 'threejs',
        icon: [
          640,
          512,
          [],
          "f41f",
          "M63.02 200.61L19.807 25.67l173.23 49.874zM106.39 50.612l21.591 87.496-86.567-24.945zM84.91 125.03l-10.724-43.465 43.008 12.346zM63.458 38.153l10.724 43.465-43.008-12.346zM149.47 62.93l10.724 43.465-43.008-12.346zM84.915 125.06l10.724 43.465-43.008-12.346z"
        ]
}

// Add the custom icon to the library
library.add(faThreeJs);


// const ThreeJs = (props) => {
//   return (
//     <svg
//         xmlns="http://www.w3.org/2000/svg"
//         xmlSpace="preserve"
//         width={2300}
//         height={601}
//         style={{
//         shapeRendering: "geometricPrecision",
//         textRendering: "geometricPrecision",
//         imageRendering: "auto",
//         fillRule: "evenodd",
//         clipRule: "evenodd",
//         }}
//         viewBox="0 0 129 34"
//         {...props}
//     >
//         <g transform="translate(8.964 4.2527)" fill-rule="evenodd" stroke="#000" stroke-linecap="butt" stroke-linejoin="round" stroke-width="4">
//             <path d="m63.02 200.61-43.213-174.94 173.23 49.874z"/>
//             <path d="m106.39 50.612 21.591 87.496-86.567-24.945z"/>
//             <path d="m84.91 125.03-10.724-43.465 43.008 12.346z"/>
//             <path d="m63.458 38.153 10.724 43.465-43.008-12.346z"/>
//             {/* <path d="m149.47 62.93 10.724 43.465-43.008-12.346z"/> */}
//             {/* <path d="m84.915 125.06 10.724 43.465-43.008-12.346z"/> */}
//         </g>
//     </svg>
//   );
// };
// export default ThreeJs;