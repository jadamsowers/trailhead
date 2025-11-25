import React, { useState, useEffect, useRef } from "react";
import type { Place } from "../../types";
import { placesAPI } from "../../services/api";

interface PlacePickerProps {
  label: string;
  value: {
    address?: string;
    placeId?: string;
    place?: Place;
  };
  onChange: (value: {
    address?: string;
    placeId?: string;
    place?: Place;
  }) => void;
  required?: boolean;
  helperText?: string;
  autoName?: string; // Preferred name (e.g., outing location) to seed search & new place creation
}

export const PlacePicker: React.FC<PlacePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  helperText,
  autoName,
}) => {
  const [options, setOptions] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [customAddress, setCustomAddress] = useState(value.address || "");
  const [showCustomInput, setShowCustomInput] = useState(false); // Hidden until no results
  const [showDropdown, setShowDropdown] = useState(false);

  // Use ref to track place selection without causing re-renders
  const placeSelectedRef = useRef(false);

  // Load initial place if placeId is provided
  useEffect(() => {
    if (value.placeId && !value.place) {
      placesAPI.getPlaces().then((places) => {
        const place = places.find((p) => p.id === value.placeId);
        if (place) {
          onChange({ ...value, place });
        }
      });
    }
  }, [value.placeId]);

  // Debounced search with useRef
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Don't search if a place was just selected
    if (placeSelectedRef.current) {
      placeSelectedRef.current = false;
      return;
    }

    if (!searchValue || showCustomInput || searchValue.length < 2) {
      setOptions([]);
      setShowDropdown(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await placesAPI.searchPlaces(searchValue, 10);
        setOptions(results);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error searching places:", error);
        setOptions([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue, showCustomInput]);

  // Seed search with autoName once (only on mount if autoName is provided)
  const autoNameUsedRef = useRef(false);
  useEffect(() => {
    if (autoName && !searchValue && !autoNameUsedRef.current) {
      setSearchValue(autoName);
      autoNameUsedRef.current = true;
    }
  }, [autoName, searchValue]);

  const handlePlaceSelect = (place: Place | null) => {
    if (place) {
      setSearchValue(place.name);
      setShowDropdown(false);
      placeSelectedRef.current = true; // Mark that a place was selected
      onChange({
        address: place.address,
        placeId: place.id,
        place: place,
      });
      setCustomAddress("");
    } else {
      setSearchValue("");
      onChange({
        address: undefined,
        placeId: undefined,
        place: undefined,
      });
    }
  };

  const handleCustomAddressChange = (address: string) => {
    setCustomAddress(address);
    onChange({
      address: address || undefined,
      placeId: undefined,
      place: undefined,
    });
  };

  const handleSaveAsPlace = async () => {
    if (!customAddress.trim()) return;
    try {
      const addressLines = customAddress.trim().split("\n");
      const baseName =
        autoName && autoName.trim() ? autoName.trim() : addressLines[0];
      const placeName = baseName.substring(0, 100);

      const newPlace = await placesAPI.createPlace({
        name: placeName,
        address: customAddress,
      });

      onChange({
        address: newPlace.address,
        placeId: newPlace.id,
        place: newPlace,
      });
      setShowCustomInput(false);
      setCustomAddress("");
      setSearchValue(newPlace.name);
    } catch (error) {
      console.error("Error saving place:", error);
      alert("Failed to save place. Please try again.");
    }
  };

  const googleMapsUrl =
    value.place?.google_maps_url ||
    (value.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        value.address
      )}`
      : undefined);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="font-bold text-sm">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </label>
        {showCustomInput && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowCustomInput(false);
              setCustomAddress("");
            }}
            className="px-2 py-1 text-xs rounded border border-[var(--bsa-olive)] text-[var(--bsa-olive)] bg-transparent hover:bg-[var(--bsa-olive)] hover:text-white transition-colors"
          >
            ← Back
          </button>
        )}
      </div>

      {helperText && (
        <p className="text-[11px] text-[var(--text-secondary)] mb-2">
          {helperText}
        </p>
      )}

      {!showCustomInput ? (
        <div className="relative">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              if (!e.target.value) handlePlaceSelect(null);
            }}
            onFocus={() => {
              if (options.length > 0) setShowDropdown(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowDropdown(false), 200);
            }}
            placeholder="Search saved places..."
            className="w-full p-2 text-sm rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--bsa-olive)]"
          />
          {loading && <div className="absolute right-2 top-2 text-sm">⏳</div>}
          {showDropdown && options.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-0.5 max-h-52 overflow-y-auto z-10 bg-[var(--bg-tertiary)] border border-[var(--card-border)] rounded shadow-lg">
              {options.map((place) => (
                <button
                  type="button"
                  key={place.id}
                  onClick={() => handlePlaceSelect(place)}
                  className="w-full text-left px-3 py-2 text-sm border-b last:border-b-0 border-[var(--card-border)] hover:bg-[rgba(var(--bsa-olive-rgb),0.1)] transition-colors"
                >
                  <div className="font-semibold">{place.name}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {place.address}
                  </div>
                </button>
              ))}
            </div>
          )}
          {showDropdown && searchValue && options.length === 0 && !loading && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCustomInput(true);
                setShowDropdown(false);
              }}
              className="absolute top-full left-0 right-0 mt-0.5 px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--card-border)] rounded text-[var(--text-secondary)] hover:bg-[rgba(var(--bsa-olive-rgb),0.1)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-left w-full"
            >
              No saved places found. <span className="text-[var(--bsa-olive)] font-semibold">Click to create a new one →</span>
            </button>
          )}
        </div>
      ) : (
        <div>
          <textarea
            value={customAddress}
            onChange={(e) => handleCustomAddressChange(e.target.value)}
            placeholder="Enter full address..."
            rows={3}
            className="w-full p-2 text-sm rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--input-text)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--bsa-olive)]"
          />
          {customAddress.trim() && (
            <button
              type="button"
              onClick={handleSaveAsPlace}
              className="mt-2 px-3 py-1.5 text-sm rounded bg-[var(--bsa-olive)] text-white font-medium hover:opacity-90 active:scale-[0.97] transition"
            >
              💾 Save as reusable place
            </button>
          )}
        </div>
      )}

      {(value.address || value.place) && (
        <div className="mt-2 p-2 rounded border border-[var(--card-border)] bg-[var(--bg-tertiary)]">
          <div className="text-sm text-[var(--text-secondary)]">
            {value.place ? (
              <>
                <strong className="text-[var(--text-primary)]">
                  {value.place.name}
                </strong>
                <br />
                {value.place.address}
              </>
            ) : (
              value.address
            )}
          </div>
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-1 text-[10px] text-[var(--bsa-olive)] underline"
            >
              Open in Google Maps 🔗
            </a>
          )}
        </div>
      )}
    </div>
  );
};
