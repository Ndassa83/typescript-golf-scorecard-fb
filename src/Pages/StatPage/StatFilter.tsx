import { useState, useEffect, useRef } from "react";
import { Autocomplete, TextField, Button } from "@mui/material";
import { PlayerOptionType, CourseOptionType, Course } from "../../types";
import "./StatFilter.css";

type ApiSearchCourse = {
  id: number;
  club_name: string;
  location: { address: string };
};

type StatFilterProps = {
  playerOptions: PlayerOptionType[];
  courseOptions: CourseOptionType[];
  selectedDate: string | null;
  handleSelectedPlayerChange: any;
  onCourseChange: (course: Course | null) => void;
  handleDateChange: any;
};

const StatFilter = ({
  playerOptions,
  courseOptions,
  selectedDate,
  handleSelectedPlayerChange,
  onCourseChange,
  handleDateChange,
}: StatFilterProps) => {
  const [query, setQuery] = useState("");
  const [apiResults, setApiResults] = useState<ApiSearchCourse[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const localMatches = query
    ? courseOptions.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase())
      )
    : courseOptions;

  useEffect(() => {
    if (!query.trim()) {
      setApiResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const apiKey = process.env.REACT_APP_GOLF_COURSE_API_KEY;
      if (!apiKey) return;
      try {
        const res = await fetch(
          `https://api.golfcourseapi.com/v1/search?search_query=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Key ${apiKey}` } }
        );
        const data = await res.json();
        setApiResults(Array.isArray(data.courses) ? data.courses.slice(0, 6) : []);
      } catch {
        setApiResults([]);
      }
    }, 300);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocal = (course: Course, label: string) => {
    setSelectedCourseName(label);
    setQuery("");
    setOpen(false);
    onCourseChange(course);
  };

  const handleSelectApi = (apiCourse: ApiSearchCourse) => {
    setSelectedCourseName(apiCourse.club_name);
    setQuery("");
    setOpen(false);
    onCourseChange({
      courseId: `api-${apiCourse.id}`,
      courseName: apiCourse.club_name,
      totalYards: 0,
      totalPar: 0,
      holes: [],
    });
  };

  const handleClear = () => {
    setSelectedCourseName(null);
    setQuery("");
    onCourseChange(null);
  };

  const showDropdown = open && (localMatches.length > 0 || apiResults.length > 0);

  return (
    <div className="filterWrapper">
      <div className="courseFilterSearch" ref={wrapperRef}>
        {selectedCourseName ? (
          <div className="courseFilterSelected">
            <span className="courseFilterSelectedName">{selectedCourseName}</span>
            <Button size="small" onClick={handleClear}>✕</Button>
          </div>
        ) : (
          <TextField
            label="Search courses..."
            size="small"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="courseSearchInput"
            autoComplete="off"
          />
        )}
        {showDropdown && (
          <div className="courseSearchDropdown">
            {localMatches.length > 0 && (
              <>
                <div className="courseDropdownSection">Your Courses</div>
                {localMatches.map((opt) => (
                  <div
                    key={opt.value.courseId}
                    className="courseSearchResult"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectLocal(opt.value, opt.label)}
                  >
                    <span className="courseSearchName">{opt.label}</span>
                  </div>
                ))}
              </>
            )}
            {apiResults.length > 0 && (
              <>
                <div className="courseDropdownSection">All Courses</div>
                {apiResults.map((c) => (
                  <div
                    key={c.id}
                    className="courseSearchResult"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectApi(c)}
                  >
                    <span className="courseSearchName">{c.club_name}</span>
                    <span className="courseSearchMeta">{c.location?.address}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <Autocomplete
        className="courseSelector"
        options={playerOptions}
        getOptionLabel={(option) => option.label}
        renderInput={(params) => <TextField {...params} label="Players" />}
        onChange={handleSelectedPlayerChange}
        size="small"
        ListboxProps={{ className: "muiListbox" }}
      />

      <TextField
        size="small"
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
        className="textField"
      />
    </div>
  );
};

export default StatFilter;
