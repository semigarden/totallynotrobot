import { faVuejs, faReact, faHtml5, faJs, faCss3Alt, faBootstrap, faFigma,
    faNode, faLaravel, faSymfony, faPhp, faPython } from "@fortawesome/free-brands-svg-icons";
import { mdiNuxt } from '@mdi/js';
import NextJsIcon from "../assets/NextJsIcon.jsx";

const data = {
    firstName: "Faulty",
    lastName: "Circuit",
    fullName: "Faulty Circuit",
    bio: "...",
    skillTabs: [
        {code: "front-end", label: "Front-End", color: "#9ca3af"},
        {code: "back-end", label: "Back-End", color: "#9ca3af"}
    ],
    skills: [
        {category: "front-end", label: "React.js", icon: faReact, iconType: "fontawesome", animation: "fa-spin", color: "#C1FFF2"},
        {category: "front-end", label: "Next.js", icon: NextJsIcon, iconType: "svg", animation: "fa-beat-fade", color: "#FFF"},
        {category: "front-end", label: "Vue.js", icon: faVuejs, iconType: "fontawesome", animation: "fa-flip", color: "#7AFDD6"},
        {category: "front-end", label: "Nuxt.js", icon: mdiNuxt, iconType: "mdi", animation: "fa-beat-fade", color: "#7AFDD6"},
        // {category: "front-end", label: "Three.js", icon: faThreeJs, iconType: "fontawesome", animation: "fa-beat-fade", color: ""},
        // {category: "front-end", label: "HTML", icon: faHtml5, iconType: "fontawesome", animation: "fa-beat-fade", color: "#EF8354"},
        // {category: "front-end", label: "JavaScript", icon: faJs, iconType: "fontawesome", animation: "fa-beat-fade", color: "#FDE74C"},
        // {category: "front-end", label: "CSS", icon: faCss3Alt, iconType: "fontawesome", animation: "fa-beat-fade", color: "#63ADF2"},
        // {category: "front-end", label: "Bootstrap", icon: faBootstrap, iconType: "fontawesome", animation: "fa-fade", color: "#7A11F3"},
        // {category: "front-end", label: "Figma", icon: faFigma, iconType: "fontawesome", animation: "fa-fade", color: "#F0C36B"},

        {category: "back-end", label: "Node.js", icon: faNode, iconType: "fontawesome", animation: "fa-fade", color: "#40F99B"},
        {category: "back-end", label: "Laravel", icon: faLaravel, iconType: "fontawesome", animation: "fa-fade", color: "#FF6F7A"},
        // {category: "back-end", label: "Symfony", icon: faSymfony, iconType: "fontawesome", animation: "fa-fade", color: "#8B94A3"},
        {category: "back-end", label: "PHP", icon: faPhp, iconType: "fontawesome", animation: "fa-fade", color: "#9B5DE5"},
        {category: "back-end", label: "Python", icon: faPython, iconType: "fontawesome", animation: "fa-fade", color: "#FDE74C"},
    ]
}

export default data;