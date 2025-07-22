import { faVuejs, faReact, faHtml5, faJs, faCss3Alt, faTumblrSquare, faFigma,
    faNode, faLaravel, faMastodon, faPhp, faPython, faGithubAlt,
    faSquareInstagram, faMonero, faRedditAlien } from "@fortawesome/free-brands-svg-icons";
import { mdiNuxt } from '@mdi/js';
import NextJsIcon from "../assets/NextJsIcon.jsx";

const data = {
    firstName: "Faulty",
    lastName: "Circuit",
    fullName: "Faulty Circuit",
    preface: "A system doesn't run on logic alone. Here's what powers mine and what short-circuits it. The stuff I work on, the things I think about and the things that just don't make sense.",
    level: 26,
    threshold: 9,
    year: 2025,
    skillTabs: [
        {code: "0", label: "Toolkit", color: "#9ca3af"},
        {code: "1", label: "Projects", color: "#9ca3af"},
        {code: "2", label: "Experience", color: "#9ca3af"},
        {code: "3", label: "Interests", color: "#9ca3af"},
    ],
    skills: [
        {category: "0", label: "React.js", icon: faReact, iconType: "fontawesome", animation: "fa-spin", color: "#C1FFF2"},
        {category: "0", label: "Next.js", icon: NextJsIcon, iconType: "svg", animation: "fa-beat-fade", color: "#FFF"},
        {category: "0", label: "Vue.js", icon: faVuejs, iconType: "fontawesome", animation: "fa-flip", color: "#7AFDD6"},
        {category: "0", label: "Nuxt.js", icon: mdiNuxt, iconType: "mdi", animation: "fa-beat-fade", color: "#7AFDD6"},
        {category: "0", label: "HTML", icon: faHtml5, iconType: "fontawesome", animation: "fa-beat-fade", color: "#EF8354"},
        {category: "0", label: "JavaScript", icon: faJs, iconType: "fontawesome", animation: "fa-beat-fade", color: "#FDE74C"},
        {category: "0", label: "CSS", icon: faCss3Alt, iconType: "fontawesome", animation: "fa-beat-fade", color: "#63ADF2"},
        {category: "0", label: "Node.js", icon: faNode, iconType: "fontawesome", animation: "fa-fade", color: "#40F99B"},
        {category: "0", label: "Laravel", icon: faLaravel, iconType: "fontawesome", animation: "fa-fade", color: "#FF6F7A"},
        {category: "0", label: "PHP", icon: faPhp, iconType: "fontawesome", animation: "fa-fade", color: "#9B5DE5"},
        {category: "0", label: "Python", icon: faPython, iconType: "fontawesome", animation: "fa-fade", color: "#FDE74C"},
        // {category: "0", label: "Github", icon: faGithubAlt, iconType: "fontawesome", animation: "fa-fade", color: "#fafbfc"},
        // {category: "0", label: "Reddit", icon: faRedditAlien, iconType: "fontawesome", animation: "fa-fade", color: "orangered"},
        // {category: "0", label: "Mastodon", icon: faMastodon, iconType: "fontawesome", animation: "fa-fade", color: "#6364ff"},
        // {category: "0", label: "Monero", icon: faMonero, iconType: "fontawesome", animation: "fa-fade", color: "#5933ad"},
    ]
}

export default data;
