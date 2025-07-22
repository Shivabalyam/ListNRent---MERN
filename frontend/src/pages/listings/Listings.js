import React, { useEffect, useState } from 'react';
import ListingCard from '../../components/ListingCard';
import './Listings.css';
import { useLocation, useNavigate } from 'react-router-dom';

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const limit = 8; // listings per page
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filtering & Sorting state
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sort, setSort] = useState('');
  const [location, setLocation] = useState('');

  // Fetch listings (append if loading more)
  const fetchListings = (pageNum = 1, filters = {}, append = false) => {
    if (append) setIsFetchingMore(true);
    else setLoading(true);
    const params = new URLSearchParams({
      page: pageNum,
      limit,
      ...(filters.minPrice && { minPrice: filters.minPrice }),
      ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
      ...(filters.minRating && { minRating: filters.minRating }),
      ...(filters.location && { location: filters.location }),
      ...(filters.sort && { sort: filters.sort })
    });
    fetch(`http://localhost:8080/api/listings?${params.toString()}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (append) {
          setListings(prev => [...prev, ...(data.listings || [])]);
        } else {
          setListings(data.listings || []);
        }
        setPages(data.pages || 1);
        setPage(data.page || 1);
        setHasMore(data.page < (data.pages || 1));
        setLoading(false);
        setIsFetchingMore(false);
      })
      .catch(err => {
        setError('Failed to load listings');
        setLoading(false);
        setIsFetchingMore(false);
      });
  };

  // Infinite scroll handler
  useEffect(() => {
    if (!hasMore || loading || isFetchingMore) return;
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200
      ) {
        if (page < pages && !isFetchingMore) {
          fetchListings(page + 1, { minPrice, maxPrice, minRating, location, sort }, true);
          setPage(page + 1);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, pages, minPrice, maxPrice, minRating, location, sort, hasMore, loading, isFetchingMore]);

  // Refetch listings when filters/sort/location change (reset to first page)
  useEffect(() => {
    setPage(1);
    fetchListings(1, { minPrice, maxPrice, minRating, location, sort }, false);
    // eslint-disable-next-line
  }, [minPrice, maxPrice, minRating, location, sort]);

  const locationHook = useLocation();
  const navigate = useNavigate();

  // Helper to get query param
  function getQueryParam(param) {
    const params = new URLSearchParams(locationHook.search);
    return params.get(param) || '';
  }

  // On mount and whenever the URL changes, set location filter from query param if present
  useEffect(() => {
    const loc = getQueryParam('location');
    setLocation(loc); // Always set, even if empty
    // eslint-disable-next-line
  }, [locationHook.search]);

  // Keep URL in sync when location filter changes
  useEffect(() => {
    const loc = getQueryParam('location');
    if (location && location !== loc) {
      const params = new URLSearchParams(locationHook.search);
      params.set('location', location);
      navigate({ search: params.toString() }, { replace: true });
    }
    if (!location && loc) {
      const params = new URLSearchParams(locationHook.search);
      params.delete('location');
      navigate({ search: params.toString() }, { replace: true });
    }
    // eslint-disable-next-line
  }, [location]);

  return (
    <div>
      <div id="filters">
        {/* Filtering & Sorting Controls */}
        <div className="row mt-3 mb-2">
          <div className="col-md-2 mb-2">
            <input type="number" className="form-control" placeholder="Min Price" value={minPrice} min={0} onChange={e => setMinPrice(e.target.value)} />
          </div>
          <div className="col-md-2 mb-2">
            <input type="number" className="form-control" placeholder="Max Price" value={maxPrice} min={0} onChange={e => setMaxPrice(e.target.value)} />
          </div>
          <div className="col-md-2 mb-2">
            <input type="number" className="form-control" placeholder="Min Rating" value={minRating} min={1} max={5} step={0.1} onChange={e => setMinRating(e.target.value)} />
          </div>
          <div className="col-md-2 mb-2">
            <input type="text" className="form-control" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div className="col-md-3 mb-2">
            <select className="form-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="">Sort By</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Rating: High to Low</option>
              <option value="rating_asc">Rating: Low to High</option>
            </select>
          </div>
        </div>
      </div>
      {loading ? <p>Loading...</p> : error ? <p>{error}</p> : (
        <>
          <div className="row row-cols-lg-4 row-cols-md-2 row-cols-sm-1 mt-3">
            {listings.map(listing => <ListingCard key={listing._id} listing={listing} />)}
          </div>
          {isFetchingMore && <div className="text-center my-3"><span className="spinner-border" role="status" aria-hidden="true"></span> Loading more...</div>}
          {!hasMore && <div className="text-center text-muted my-3">No more listings to show.</div>}
        </>
      )}
    </div>
  );
};

export default Listings; 