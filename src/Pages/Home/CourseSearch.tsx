import { useState, useEffect, useRef } from "react";
import { TextField, Button } from "@mui/material";
import { Course, Hole, CourseOptionType } from "../../types";
import "./CourseSearch.css";

type ApiSearchCourse = {
  id: number;
  club_name: string;
  course_name: string;
  location: { address: string };
};

type ApiHole = {
  par: number;
  yardage: number;
  handicap: number;
};

type ApiTee = {
  tee_name: string;
  course_rating: number;
  slope_rating: number;
  total_yards: number;
  par_total: number;
  holes: ApiHole[];
};

type ApiCourseDetail = {
  course: {
    id: number;
    club_name: string;
    tees: {
      male?: ApiTee[];
      female?: ApiTee[];
    };
  };
};

type PendingCourse = {
  id: number;
  name: string;
  maleTees: ApiTee[];
  femaleTees: ApiTee[];
};

type CourseSearchProps = {
  onPlayCourse: (course: Course) => void;
  courseOptions?: CourseOptionType[];
};

const CourseSearch = ({ onPlayCourse, courseOptions = [] }: CourseSearchProps) => {
  const [query, setQuery] = useState("");
  const [apiResults, setApiResults] = useState<ApiSearchCourse[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCourse, setPendingCourse] = useState<PendingCourse | null>(null);
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
      try {
        const apiKey = process.env.REACT_APP_GOLF_COURSE_API_KEY;
        if (!apiKey) {
          setApiResults([]);
          return;
        }
        const res = await fetch(
          `https://api.golfcourseapi.com/v1/search?search_query=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Key ${apiKey}` } }
        );
        const data = await res.json();
        setApiResults(Array.isArray(data.courses) ? data.courses.slice(0, 8) : []);
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
    onPlayCourse(course);
  };

  const handleSelectApi = async (apiCourse: ApiSearchCourse) => {
    setQuery("");
    setApiResults([]);
    setOpen(false);
    setError(null);
    setPendingCourse(null);
    setLoading(true);
    try {
      const apiKey = process.env.REACT_APP_GOLF_COURSE_API_KEY;
      const res = await fetch(
        `https://api.golfcourseapi.com/v1/courses/${apiCourse.id}`,
        { headers: { Authorization: `Key ${apiKey}` } }
      );
      const data: ApiCourseDetail = await res.json();
      const { course } = data;
      const maleTees = course.tees?.male ?? [];
      const femaleTees = course.tees?.female ?? [];

      if (!maleTees.length && !femaleTees.length) {
        setError(
          `No tee data found for "${apiCourse.club_name}". Try creating the course manually.`
        );
        return;
      }

      setPendingCourse({
        id: course.id,
        name: course.club_name,
        maleTees,
        femaleTees,
      });
    } catch (err) {
      console.error("Course detail fetch failed:", err);
      setError("Failed to load course data. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleTeeSelect = (tee: ApiTee) => {
    if (!pendingCourse) return;
    const holes: Hole[] = tee.holes.map((h, i) => ({
      holeNumber: i + 1,
      yards: h.yardage,
      par: h.par,
      handicap: h.handicap,
    }));
    const course: Course = {
      courseId: `api-${pendingCourse.id}`,
      courseName: pendingCourse.name,
      totalYards: tee.total_yards,
      totalPar: tee.par_total,
      holes,
    };
    setSelectedCourseName(pendingCourse.name);
    setPendingCourse(null);
    onPlayCourse(course);
  };

  const handleClear = () => {
    setSelectedCourseName(null);
    setQuery("");
    setApiResults([]);
    setPendingCourse(null);
    setError(null);
  };

  const showDropdown =
    open && !pendingCourse && (localMatches.length > 0 || apiResults.length > 0);

  return (
    <div className="courseSearchContainer" ref={wrapperRef}>
      {selectedCourseName && !pendingCourse ? (
        <div className="courseFilterSelected">
          <span className="courseFilterSelectedName">{selectedCourseName}</span>
          <Button size="small" onClick={handleClear}>✕</Button>
        </div>
      ) : (
        <TextField
          label={loading ? "Loading course data..." : "Search courses..."}
          size="small"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="courseSearchInput"
          autoComplete="off"
          disabled={loading || !!pendingCourse}
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
      {error && <div className="courseSearchError">{error}</div>}
      {pendingCourse && (
        <div className="teeSelectContainer">
          <div className="teeSelectTitle">{pendingCourse.name} — Select Tees</div>
          {pendingCourse.maleTees.length > 0 && (
            <div className="teeGroup">
              <div className="teeGroupLabel">Men's</div>
              {pendingCourse.maleTees.map((tee) => (
                <div
                  key={`male-${tee.tee_name}`}
                  className="teeOption"
                  onClick={() => handleTeeSelect(tee)}
                >
                  <span className="teeName">{tee.tee_name}</span>
                  <span className="teeMeta">
                    {tee.total_yards} yds · Par {tee.par_total} · Rating{" "}
                    {tee.course_rating} / {tee.slope_rating}
                  </span>
                </div>
              ))}
            </div>
          )}
          {pendingCourse.femaleTees.length > 0 && (
            <div className="teeGroup">
              <div className="teeGroupLabel">Women's</div>
              {pendingCourse.femaleTees.map((tee) => (
                <div
                  key={`female-${tee.tee_name}`}
                  className="teeOption"
                  onClick={() => handleTeeSelect(tee)}
                >
                  <span className="teeName">{tee.tee_name}</span>
                  <span className="teeMeta">
                    {tee.total_yards} yds · Par {tee.par_total} · Rating{" "}
                    {tee.course_rating} / {tee.slope_rating}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Button size="small" onClick={() => setPendingCourse(null)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default CourseSearch;
