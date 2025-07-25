import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import Icon from "@/components/common/Icon.tsx";
import styles from "@/styles/Panel.module.scss";

const Item = ({ item, moveRow, index, itemRefs }) => {
  const ref = useRef(null);

  const [collectedProps, drop] = useDrop({
    accept: "dnd-character",
    collect(monitor) {
      return {
          handlerId: monitor.getHandlerId()
      };
    },

    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    }
  });

  const [collectedDragProps, drag] = useDrag({
    type: "dnd-character",

    item: () => {
      return { item, index };
    },

    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const trans = collectedDragProps.isDragging ? 0 : 1;

  drag(drop(ref));

  // Store ref for position tracking
  if (itemRefs && ref.current) {
    itemRefs.current[item.label] = ref.current;
  }

  return (
    <div
      className={styles.item}
      ref={ref}
      style={{
          opacity: trans,
          willChange: collectedDragProps.isDragging ? 'transform' : 'auto'
      }}
      data-handler-id={collectedProps.handlerId}
    >
      <Icon icon={item.icon} iconType={item.iconType} color={item.color} animation={`${styles.icon} ${item.animation}`} />
      <div className={styles.name}>{item.label}</div>
    </div>
  );
};

export default Item;
