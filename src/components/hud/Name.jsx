import React from 'react';
import "styles/hud/Name.scss";

const Name = ({ className, name = "Faulty Circuit" }) => {
    return (
        <div className={`name ${className}`}>
            <div className="circle">
                <div className="circle-glow"/>
            </div>
            <div className="circle-line">
                <div className="line-0"/>
                <div className="line-1"/>
            </div>
            <div className="square">
                <div className="square-glow"/>
            </div>
            <div className="frame">
                <div className="frame-top">
                    <div className="frame-1" augmented-ui="tl-clip exe"/>
                    <div className="line-1" augmented-ui="tl-clip exe"/>
                    <div className="line-2"/>
                    <div className="frame-2" augmented-ui="br-clip exe"/>
                    <div className="frame-3" augmented-ui="tl-clip tr-clip exe"/>
                </div>
                <div className="frame-main">
                    <div className="text">{name}</div>
                    <div className="animation">
                        {Array.from({length: 16}).map((_, index) => (
                            <div className="arrow" key={index}>
                                <div className="line-1" augmented-ui="tr-clip bl-clip exe"/>
                                <div className="line-2" augmented-ui="br-clip tl-clip exe"/>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="frame-bottom">
                    <div className="frame-1" augmented-ui="tl-clip br-clip exe"/>
                    <div className="frame-2" augmented-ui="br-clip exe"/>
                    <div className="frame-3" augmented-ui="tl-clip exe"/>
                    <div className="frame-4" augmented-ui="br-clip tl-clip exe"/>
                    <div className="frame-5" augmented-ui="br-clip exe"/>
                </div>
            </div>
        </div>
    );
};

export default Name;
