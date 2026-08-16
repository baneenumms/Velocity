import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import "./SearchableSelect.css";

const COLOR_SWATCHES = {
  Beige: "#d8c7a4",
  Black: "#171717",
  Blue: "#3b82c4",
  Bronze: "#a66b3f",
  Brown: "#7b4b2a",
  Gold: "#c79a32",
  Green: "#3f8a55",
  Grey: "#8b929a",
  Maroon: "#7f243f",
  Orange: "#e88932",
  Purple: "#7650a8",
  Red: "#cf3f4a",
  Silver: "#bcc4cc",
  White: "#ffffff",
  Yellow: "#e7c844",
};

function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  emptyMessage = "No approved options found",
  showColorSwatch = false,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredOptions = useMemo(() => {
    const query = value.trim().toLowerCase();

    if (!query) {
      return options;
    }

    return options
      .filter((option) => option.toLowerCase().includes(query))
      .sort((left, right) => {
        const leftStarts = left.toLowerCase().startsWith(query);
        const rightStarts = right.toLowerCase().startsWith(query);

        if (leftStarts !== rightStarts) {
          return leftStarts ? -1 : 1;
        }

        return left.localeCompare(right);
      });
  }, [options, value]);

  const commitSelection = (option) => {
    onChange(option);
    setOpen(false);
    setActiveIndex(0);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
      } else if (filteredOptions.length) {
        setActiveIndex((current) =>
          Math.min(current + 1, filteredOptions.length - 1)
        );
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && open && filteredOptions.length) {
      event.preventDefault();
      commitSelection(filteredOptions[activeIndex] || filteredOptions[0]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="searchable-select">
      <div className="searchable-select-input-wrap">
        <Search size={17} aria-hidden="true" />

        <input
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          onFocus={() => {
            setOpen(true);
            setActiveIndex(0);
          }}
          onBlur={() => {
            const exactOption = options.find(
              (option) => option.toLowerCase() === value.trim().toLowerCase()
            );

            if (exactOption && exactOption !== value) {
              onChange(exactOption);
            }

            window.setTimeout(() => setOpen(false), 120);
          }}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && !disabled && (
        <div
          id={`${id}-options`}
          className="searchable-select-options"
          role="listbox"
        >
          {filteredOptions.length ? (
            filteredOptions.map((option, index) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === value}
                className={index === activeIndex ? "active" : ""}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commitSelection(option)}
              >
                {showColorSwatch && (
                  <span
                    className="searchable-select-swatch"
                    style={{ backgroundColor: COLOR_SWATCHES[option] }}
                    aria-hidden="true"
                  />
                )}

                <span>{option}</span>
              </button>
            ))
          ) : (
            <p>{emptyMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
