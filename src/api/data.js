import { faVuejs, faReact, faHtml5, faJs, faCss3Alt, faTumblrSquare, faFigma,
    faNode, faLaravel, faMastodon, faPhp, faPython, faGithubAlt,
    faSquareInstagram } from "@fortawesome/free-brands-svg-icons";
import { mdiNuxt } from '@mdi/js';
import NextJsIcon from "../assets/NextJsIcon.jsx";

const data = {
    firstName: "Faulty",
    lastName: "Circuit",
    fullName: "Faulty Circuit",
    preface: "Gates open with spark —\ncalcium flows like a thought.\nI remember light.",
    skillTabs: [
        {code: "0", label: "000", color: "#9ca3af"},
        {code: "1", label: "001", color: "#9ca3af"},
        {code: "2", label: "002", color: "#9ca3af"},
        {code: "3", label: "003", color: "#9ca3af"},

    ],
    skills: [
        {category: "0", label: "React.js", icon: faReact, iconType: "fontawesome", animation: "fa-spin", color: "#C1FFF2"},
        {category: "0", label: "Next.js", icon: NextJsIcon, iconType: "svg", animation: "fa-beat-fade", color: "#FFF"},
        {category: "0", label: "Vue.js", icon: faVuejs, iconType: "fontawesome", animation: "fa-flip", color: "#7AFDD6"},
        {category: "0", label: "Nuxt.js", icon: mdiNuxt, iconType: "mdi", animation: "fa-beat-fade", color: "#7AFDD6"},
        {category: "0", label: "HTML", icon: faHtml5, iconType: "fontawesome", animation: "fa-beat-fade", color: "#EF8354"},
        {category: "0", label: "JavaScript", icon: faJs, iconType: "fontawesome", animation: "fa-beat-fade", color: "#FDE74C"},
        {category: "0", label: "CSS", icon: faCss3Alt, iconType: "fontawesome", animation: "fa-beat-fade", color: "#63ADF2"},
        {category: "0", label: "Figma", icon: faFigma, iconType: "fontawesome", animation: "fa-fade", color: "#F0C36B"},

        {category: "0", label: "Node.js", icon: faNode, iconType: "fontawesome", animation: "fa-fade", color: "#40F99B"},
        {category: "0", label: "Laravel", icon: faLaravel, iconType: "fontawesome", animation: "fa-fade", color: "#FF6F7A"},
        {category: "0", label: "PHP", icon: faPhp, iconType: "fontawesome", animation: "fa-fade", color: "#9B5DE5"},
        {category: "0", label: "Python", icon: faPython, iconType: "fontawesome", animation: "fa-fade", color: "#FDE74C"},
        {category: "0", label: "Github", icon: faGithubAlt, iconType: "fontawesome", animation: "fa-fade", color: "#fafbfc"},
        {category: "0", label: "Tumblr", icon: faTumblrSquare, iconType: "fontawesome", animation: "fa-fade", color: "#fafbfc"},
        {category: "0", label: "Mastodon", icon: faMastodon, iconType: "fontawesome", animation: "fa-fade", color: "#6364ff"},
        // {category: "0", label: "Instagram", icon: faSquareInstagram, iconType: "fontawesome", animation: "fa-fade", color: "#d0006d"},
    ]
}

export default data;