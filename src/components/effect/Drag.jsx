import { useCallback, useState, useEffect } from "react";
import Item from "@/components/common/Item";
import { DndProvider } from "react-dnd";
import update from "immutability-helper";
import { Backend } from "@/utils/utils";

const Drag = ({ itemsData, itemRefs, className = "" }) => {
    const [items, setItems] = useState(itemsData);

    useEffect(() => {
        setItems(itemsData);
    }, [itemsData]);

    const moveRow = useCallback((dragIndex, hoverIndex) => {
        setItems((prevItems) =>
            update(prevItems, {
                $splice: [
                    [dragIndex, 1],
                    [hoverIndex, 0, prevItems[dragIndex]]
                ]
            })
        );

    }, []);

    return (
        <DndProvider backend={Backend}>
            <div className={`${className}`}>
                {items.map((item, index) => (
                    <Item
                        index={index}
                        key={item.label}
                        item={item}
                        moveRow={moveRow}
                        itemRefs={itemRefs}
                    />
                ))}
            </div>
        </DndProvider>
    );
};

export default Drag;
