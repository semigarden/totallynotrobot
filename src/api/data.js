import { faVuejs, faReact, faHtml5, faJs, faCss3Alt, faTumblrSquare, faFigma,
    faNode, faLaravel, faMastodon, faPhp, faPython, faGithubAlt,
    faSquareInstagram, faMonero, faRedditAlien } from "@fortawesome/free-brands-svg-icons";
import { mdiNuxt } from '@mdi/js';
import NextJsIcon from "../assets/NextJsIcon.jsx";

const data = {
    firstName: "Name",
    lastName: "Surname",
    fullName: "Name Surname",
    preface: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    skillTabs: [
        {code: "0", label: "000", color: "#9ca3af"},
        {code: "1", label: "001", color: "#9ca3af"},
        {code: "2", label: "002", color: "#9ca3af"},
        {code: "3", label: "003", color: "#9ca3af"},
        {code: "4", label: "004", color: "#9ca3af"},

    ],
    skills: [
        {category: "0", label: "React.js", icon: faReact, iconType: "fontawesome", animation: "fa-spins", color: "#C1FFF2"},
        {category: "0", label: "Next.js", icon: NextJsIcon, iconType: "svg", animation: "fa-beat-fades", color: "#FFF"},
        {category: "0", label: "Vue.js", icon: faVuejs, iconType: "fontawesome", animation: "fa-flips", color: "#7AFDD6"},
        {category: "0", label: "Nuxt.js", icon: mdiNuxt, iconType: "mdi", animation: "fa-beat-fades", color: "#7AFDD6"},
        {category: "0", label: "HTML", icon: faHtml5, iconType: "fontawesome", animation: "fa-beat-fades", color: "#EF8354"},
        {category: "0", label: "JavaScript", icon: faJs, iconType: "fontawesome", animation: "fa-beat-fades", color: "#FDE74C"},
        {category: "0", label: "CSS", icon: faCss3Alt, iconType: "fontawesome", animation: "fa-beat-fades", color: "#63ADF2"},
        // {category: "0", label: "Figma", icon: faFigma, iconType: "fontawesome", animation: "fa-fade", color: "#F0C36B"},

        {category: "0", label: "Node.js", icon: faNode, iconType: "fontawesome", animation: "fa-fades", color: "#40F99B"},
        {category: "0", label: "Laravel", icon: faLaravel, iconType: "fontawesome", animation: "fa-fades", color: "#FF6F7A"},
        {category: "0", label: "PHP", icon: faPhp, iconType: "fontawesome", animation: "fa-fades", color: "#9B5DE5"},
        {category: "0", label: "Python", icon: faPython, iconType: "fontawesome", animation: "fa-fades", color: "#FDE74C"},
        {category: "0", label: "Github", icon: faGithubAlt, iconType: "fontawesome", animation: "fa-fades", color: "#fafbfc"},
        // {category: "0", label: "Tumblr", icon: faTumblrSquare, iconType: "fontawesome", animation: "fa-fades", color: "#fafbfc"},
        {category: "0", label: "Reddit", icon: faRedditAlien, iconType: "fontawesome", animation: "fa-fades", color: "orangered"},
        {category: "0", label: "Mastodon", icon: faMastodon, iconType: "fontawesome", animation: "fa-fades", color: "#6364ff"},
        {category: "0", label: "Monero", icon: faMonero, iconType: "fontawesome", animation: "fa-fades", color: "#5933ad"},
        // {category: "0", label: "Instagram", icon: faSquareInstagram, iconType: "fontawesome", animation: "fa-fade", color: "#d0006d"},
    ]
}

export default data;