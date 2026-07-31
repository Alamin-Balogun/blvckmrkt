import {useEffect} from "react";
import {useLocation} from "react-router-dom";

// React Router doesn't reset scroll position on navigation — without this,
// landing on a new page keeps whatever scroll offset the previous page was
// at (e.g. mid-scroll on Shop → About opens About already scrolled down).
export default function ScrollToTop() {
  const {pathname} = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
