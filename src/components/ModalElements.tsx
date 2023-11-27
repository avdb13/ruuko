import {
  ComponentProps,
  ComponentPropsWithoutRef,
  useEffect,
  useRef,
  useState,
} from "react";

// no idea why we need this but sure.
export const ModalInput = (props: ComponentPropsWithoutRef<"input">) => {
  const ref = useRef<HTMLInputElement>();

  return <input ref={ref} onClick={() => ref.current?.focus()} {...props} />;
};

interface SelectProps extends ComponentProps<"select"> {
  options: string[];
}

// doesn't work properly ...
export const ModalSelect = (props: SelectProps) => {
  const [visible, setVisible] = useState(false);

  const ref = useRef<HTMLSelectElement>();
  console.log(ref.current?.size);

  return (
    <select
      ref={ref}
      onClick={() => {
        console.log("clicked select");
        ref.current && ref.current.size === 0 ? (ref.current.size = props.options.length) : null
      }}
      onBlur={() => (ref.current ? (ref.current.size = 0) : null)}
      {...props}
    >
      {props.options.map((option) => (
        <option
          onClick={() => {
            console.log("clicked option", option);
            if (ref.current) {
              ref.current.value = option;
              ref.current.size = 0;
              ref.current.blur();
            }
          }}
        >
          {option}
        </option>
      ))}
    </select>
  );
};
