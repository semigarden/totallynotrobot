import { faVuejs, faReact, faHtml5, faJs, faCss3Alt, faBootstrap, faFigma,
    faNode, faLaravel, faSymfony, faPhp, faPython } from "@fortawesome/free-brands-svg-icons";

const data = {
    firstName: "Giorgi",
    lastName: "Khetaguri",
    fullName: "Giorgi Khetaguri",
    bio: "Hello, I'm Giorgi, a results-driven versatile developer skilled in crafting seamless front-end experiences and robust back-end solutions. Bridging the gap between design aesthetics and seamless functionality.",
    skillTabs: [
        {code: "front-end", label: "Front-End", color: "#9ca3af"},
        {code: "back-end", label: "Back-End", color: "#9ca3af"}
    ],
    skills: [
        {category: "front-end", label: "React.js", icon: faReact, animation: "fa-spin", color: "#C1FFF2"},
        {category: "front-end", label: "Vue.js", icon: faVuejs, animation: "fa-flip", color: "#7AFDD6"},
        // {category: "front-end", label: "Three.js", icon: faThreeJs, animation: "fa-beat-fade", color: ""},
        {category: "front-end", label: "HTML5", icon: faHtml5, animation: "fa-beat-fade", color: "#EF8354"},
        {category: "front-end", label: "JavaScript", icon: faJs, animation: "fa-beat-fade", color: "#FDE74C"},
        {category: "front-end", label: "CSS3", icon: faCss3Alt, animation: "fa-beat-fade", color: "#63ADF2"},
        {category: "front-end", label: "Bootstrap", icon: faBootstrap, animation: "fa-fade", color: "#7A11F3"},
        {category: "front-end", label: "Figma", icon: faFigma, animation: "fa-fade", color: "#F0C36B"},

        {category: "back-end", label: "Node.js", icon: faNode, animation: "fa-fade", color: "#40F99B"},
        {category: "back-end", label: "Laravel", icon: faLaravel, animation: "fa-fade", color: "#FF6F7A"},
        {category: "back-end", label: "Symfony", icon: faSymfony, animation: "fa-fade", color: "#8B94A3"},
        {category: "back-end", label: "PHP", icon: faPhp, animation: "fa-fade", color: "#9B5DE5"},
        {category: "back-end", label: "Python", icon: faPython, animation: "fa-fade", color: "#FDE74C"},
    ]
}

export default data;