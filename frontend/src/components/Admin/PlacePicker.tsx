import React, { useState, useEffect, useRef } from "react";
import type { Place } from "../../types";
import { placesAPI, nominatimAPI, type NominatimResult } from "../../services/api";

interface PlacePickerProps {
  label: string;
  value: {
    name?: string;
    address?: string;
    placeId?: string;
    place?: Place;
  };
  onChange: (value: {
    name?: string;
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
  const [options, setOptions] = useState<any[]>([]);
  const [nominatimResults, setNominatimResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [customAddress, setCustomAddress] = useState(value.address || "");
  const [customName, setCustomName] = useState(value.name || autoName || "");
  const [showCustomInput, setShowCustomInput] = useState(false); // Hidden until no results
  const [showDropdown, setShowDropdown] = useState(false);

  // Use ref to track place selection without causing re-renders
  const placeSelectedRef = useRef(false);

  // Load initial place if placeId is provided
  useEffect(() => {
    if (value.placeId && !value.place) {
      placesAPI.getPlaces().then((places: any[]) => {
        const place = places.find((p: any) => p.id === value.placeId);
        if (place) {
          onChange({
            ...value,
            name: place.name,
            address: place.address,
            placeId: place.id,
            place: undefined,
          });
        }
      });
    }
  }, [value.placeId]);

  // Helper function to format saved place address into two-line format
  const formatSavedPlaceAddress = (address: string): { line1: string; line2: string } => {
    const lines = address.split("\n").map(l => l.trim()).filter(l => l);
    if (lines.length >= 2) {
      return { line1: lines[0], line2: lines.slice(1).join(", ") };
    } else if (lines.length === 1) {
      // Try to split on comma
      const parts = lines[0].split(",").map(p => p.trim());
      if (parts.length >= 2) {
        return { line1: parts[0], line2: parts.slice(1).join(", ") };
      }
      return { line1: lines[0], line2: "" };
    }
    return { line1: address, line2: "" };
  };

  // Helper function to format Nominatim address into two-line format
  const formatNominatimAddress = (result: NominatimResult): string => {
    const addr = result.address;
    const line1Parts: string[] = [];
    const line2Parts: string[] = [];

    // Line 1: Street address
    if (addr.house_number) line1Parts.push(addr.house_number);
    if (addr.road) line1Parts.push(addr.road);

    // Line 2: City, State ZIP
    const city = addr.city || addr.town || addr.village || "";
    if (city) line2Parts.push(city);
    
    const stateParts: string[] = [];
    if (addr.state) stateParts.push(addr.state);
    if (addr.postcode) stateParts.push(addr.postcode);
    if (stateParts.length > 0) line2Parts.push(stateParts.join(" "));

    const lines: string[] = [];
    if (line1Parts.length > 0) lines.push(line1Parts.join(" "));
    if (line2Parts.length > 0) lines.push(line2Parts.join(", "));

    return lines.join("\n") || result.display_name;
  };

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
      setNominatimResults([]);
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
        // First, search saved places
        const savedPlaces = await placesAPI.searchPlaces(searchValue, 10);
        setOptions(savedPlaces);

        // If no saved places found, search Nominatim
        if (savedPlaces.length === 0) {
          const nominatimPlaces = await nominatimAPI.search(searchValue, 5);
          setNominatimResults(nominatimPlaces);
        } else {
          setNominatimResults([]);
        }

        setShowDropdown(true);
      } catch (error) {
        console.error("Error searching places:", error);
        setOptions([]);
        setNominatimResults([]);
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

  const handlePlaceSelect = (place: any | null) => {
    if (place) {
      setSearchValue(place.name);
      setShowDropdown(false);
      placeSelectedRef.current = true; // Mark that a place was selected
      onChange({
        name: place.name,
        address: place.address,
        placeId: place.id,
        place: undefined,
      });
      setCustomAddress("");
      setCustomName(place.name);
    } else {
      setSearchValue("");
      onChange({
        name: undefined,
        address: undefined,
        placeId: undefined,
        place: undefined,
      });
    }
  };

  const handleCustomAddressChange = (address: string) => {
    setCustomAddress(address);
    onChange({
      name: customName || undefined,
      address: address || undefined,
      placeId: undefined,
      place: undefined,
    });
  };

  const handleCustomNameChange = (name: string) => {
    setCustomName(name);
    onChange({
      name: name || undefined,
      address: customAddress || undefined,
      placeId: undefined,
      place: undefined,
    });
  };

  const handleNominatimSelect = (result: NominatimResult) => {
    const formattedAddress = formatNominatimAddress(result);
    const placeName = result.address.road || result.display_name.split(",")[0];
    
    setSearchValue(placeName);
    setShowDropdown(false);
    placeSelectedRef.current = true;
    onChange({
      name: placeName,
      address: formattedAddress,
      placeId: undefined,
      place: undefined,
    });
    setCustomAddress(formattedAddress);
    setCustomName(placeName);
  };

  const handleSaveAsPlace = async () => {
    if (!customAddress.trim()) return;
    try {
      const addressLines = customAddress.trim().split("\n");
      // Prefer the user's Title; fall back to autoName or the first address line
      const baseName =
        (customName && customName.trim()) ||
        (autoName && autoName.trim()) ||
        addressLines[0];
      const placeName = baseName.substring(0, 100);

      const newPlace = await placesAPI.createPlace({
        name: placeName,
        address: customAddress,
      });

      onChange({
        name: newPlace.name,
        address: newPlace.address,
        placeId: newPlace.id,
        place: undefined,
      });
      setShowCustomInput(false);
      setCustomAddress("");
      setCustomName("");
      setSearchValue(newPlace.name);
    } catch (error) {
      console.error("Error saving place:", error);
      alert("Failed to save place. Please try again.");
    }
  };

  // Helper to split Nominatim result into display parts
  const getNominatimDisplayParts = (result: NominatimResult) => {
    const addr = result.address;
    
    // Determine the title (name of the place)
    // Priority: name > amenity > road > first part of display_name
    const title = result.name || 
                  addr.amenity || 
                  addr.road || 
                  result.display_name.split(",")[0];
    
    const addressLine1Parts: string[] = [];
    const addressLine2Parts: string[] = [];

    // Line 1: Street address (house number + road)
    // Only show if we have a specific name/amenity (not just the road name as title)
    if (title !== addr.road) {
      if (addr.house_number) addressLine1Parts.push(addr.house_number);
      if (addr.road) addressLine1Parts.push(addr.road);
    }

    // Line 2: City, State ZIP
    const city = addr.city || addr.town || addr.village || "";
    if (city) addressLine2Parts.push(city);
    
    const stateParts: string[] = [];
    if (addr.state) stateParts.push(addr.state);
    if (addr.postcode) stateParts.push(addr.postcode);
    if (stateParts.length > 0) addressLine2Parts.push(stateParts.join(" "));

    // Build the subtext
    const subtextLines: string[] = [];
    if (addressLine1Parts.length > 0) {
      subtextLines.push(addressLine1Parts.join(" "));
    }
    if (addressLine2Parts.length > 0) {
      subtextLines.push(addressLine2Parts.join(", "));
    }
    
    const header = title;
    const subtext = subtextLines.join("\n");
    
    return { header, subtext };
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
          {showDropdown && (options.length > 0 || nominatimResults.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-0.5 max-h-52 overflow-y-auto z-10 bg-[var(--bg-tertiary)] border border-[var(--card-border)] rounded shadow-lg">
              {/* Saved places */}
              {options.map((place) => {
                const { line1, line2 } = formatSavedPlaceAddress(place.address);
                return (
                  <button
                    type="button"
                    key={place.id}
                    onClick={() => handlePlaceSelect(place)}
                    className="w-full text-left px-3 py-2 text-sm border-b border-[var(--card-border)] hover:bg-[rgba(var(--bsa-olive-rgb),0.1)] transition-colors"
                  >
                    <div className="font-semibold">💾 {place.name}</div>
                    {line1 && <div className="text-[11px] text-[var(--text-secondary)]">{line1}</div>}
                    {line2 && <div className="text-[11px] text-[var(--text-secondary)]">{line2}</div>}
                  </button>
                );
              })}

              {/* Nominatim results */}
              {nominatimResults.map((result) => {
                const { header, subtext } = getNominatimDisplayParts(result);
                return (
                  <button
                    type="button"
                    key={result.place_id}
                    onClick={() => handleNominatimSelect(result)}
                    className="w-full text-left px-3 py-2 text-sm border-b border-[var(--card-border)] hover:bg-[rgba(var(--bsa-olive-rgb),0.1)] transition-colors"
                  >
                    <div className="font-bold text-[var(--text-primary)]">🌍 {header}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] whitespace-pre-line">
                      {subtext}
                    </div>
                  </button>
                );
              })}
              
              {/* Manual entry option - always show at the end */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCustomName(autoName || "");
                  setCustomAddress("");
                  setShowCustomInput(true);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-3 py-2 text-sm border-t-2 border-[var(--card-border)] bg-[var(--bg-secondary)] hover:bg-[rgba(var(--bsa-olive-rgb),0.1)] transition-colors"
              >
                <span className="text-[var(--bsa-olive)] font-semibold">➕ Add place manually</span>
              </button>
            </div>
          )}
          {showDropdown && searchValue && options.length === 0 && nominatimResults.length === 0 && !loading && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // If input starts with a number, treat as address; else treat as name
                const isAddress = /^\d/.test(searchValue.trim());
                if (isAddress) {
                  setCustomAddress(searchValue);
                  // Suggest a name: use autoName if provided, else first line of address
                  let suggestedName = autoName && autoName.trim();
                  if (!suggestedName) {
                    const firstLine = searchValue.split("\n")[0].trim();
                    suggestedName = firstLine;
                  }
                  setCustomName(suggestedName || "");
                } else {
                  setCustomName(searchValue);
                  setCustomAddress("");
                }
                setShowCustomInput(true);
                setShowDropdown(false);
              }}
              className="absolute top-full left-0 right-0 mt-0.5 px-3 py-2 text-sm bg-[var(--bg-tertiary)] border border-[var(--card-border)] rounded text-[var(--text-secondary)] hover:bg-[rgba(var(--bsa-olive-rgb),0.1)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-left w-full"
            >
              No saved places found.{" "}
              <span className="text-[var(--bsa-olive)] font-semibold">
                Click to create a new one →
              </span>
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => handleCustomNameChange(e.target.value)}
              placeholder="Title (e.g., Camp Whispering Pines)"
              className="w-full p-2 text-sm rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-[var(--bsa-olive)]"
            />
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              A short title helps identify the place.
            </p>
          </div>
          <textarea
            value={customAddress}
            onChange={(e) => handleCustomAddressChange(e.target.value)}
            placeholder={
              "Enter address in two lines, e.g.\n117 Deer Run Road\nCimarron, NM 87714 (ZIP code is optional)"
            }
            rows={3}
            className="w-full p-2 text-sm rounded border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--input-text)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--bsa-olive)]"
          />
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Format: first line is the street; second line is city and state; ZIP
            optional.
          </p>
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
              <>
                {value.name && (
                  <>
                    <strong className="text-[var(--text-primary)]">
                      {value.name}
                    </strong>
                    <br />
                  </>
                )}
                {value.address}
              </>
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
