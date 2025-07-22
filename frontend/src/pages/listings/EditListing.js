import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { BACKEND_URL } from '../../config';

const EditListing = () => {
  const { user } = useContext(UserContext);
  const { id } = useParams();
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    country: '',
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/listings/${id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.listing) throw new Error('Listing not found');
        setForm({
          title: data.listing.title || '',
          description: data.listing.description || '',
          price: data.listing.price || '',
          location: data.listing.location || '',
          country: data.listing.country || '',
        });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="alert alert-danger mt-3">{error}</p>;
  if (!user) return <p className="alert alert-danger mt-3">You must be logged in to edit a listing.</p>;
  if (user.role !== 'admin') return <p className="alert alert-danger mt-3">You are not authorized to edit this listing.</p>;

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = e => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    for (let key in form) formData.append(`listing[${key}]`, form[key]);
    if (image) formData.append('image', image);
    try {
      const res = await fetch(`${BACKEND_URL}/api/listings/${id}`, { method: 'PUT', credentials: 'include', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update listing');
      navigate(`/listings/${id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="needs-validation mt-3" noValidate encType="multipart/form-data">
      <div className="row">
        <div className="col-8 offset-2">
          <h1>Edit Your Listing</h1>
          <br />
          <div className="mb-3">
            <label htmlFor="title" className="form-label">Title</label>
            <input name="title" id="title" className="form-control" placeholder="Enter title" required value={form.title} onChange={handleChange} />
            <div className="invalid-feedback">Please enter a title.</div>
            <div className="valid-feedback">Title looks Good!</div>
          </div>
          <div className="mb-3">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea name="description" id="description" placeholder="Enter description" className="form-control" required value={form.description} onChange={handleChange} />
            <div className="invalid-feedback">Please enter a description.</div>
            <div className="valid-feedback">Description looks Good!</div>
          </div>
          <div className="mb-3">
            <label htmlFor="imageFile" className="form-label">Upload New Image</label>
            <input type="file" name="image" className="form-control" accept="image/*" onChange={handleImage} />
          </div>
          <div className="row">
            <div className="mb-3 col-4">
              <label htmlFor="price" className="form-label">Price</label>
              <input type="number" name="price" id="price" placeholder="Enter price" className="form-control" required value={form.price} onChange={handleChange} />
              <div className="invalid-feedback">Please enter a valid price.</div>
              <div className="valid-feedback">Price looks Good!</div>
            </div>
            <div className="mb-3 col-8">
              <label htmlFor="location" className="form-label">Location</label>
              <input type="text" name="location" id="location" placeholder="Enter location" className="form-control" required value={form.location} onChange={handleChange} />
              <div className="invalid-feedback">Please enter a location.</div>
              <div className="valid-feedback">Location looks Good!</div>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="country" className="form-label">Country</label>
            <input type="text" name="country" id="country" placeholder="Enter country" className="form-control" required value={form.country} onChange={handleChange} />
            <div className="invalid-feedback">Please enter a country.</div>
            <div className="valid-feedback">Country looks Good!</div>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <br />
          <button type="submit" className="btn btn-dark edit-btn mt-3">Edit</button>
          <br /><br />
        </div>
      </div>
    </form>
  );
};

export default EditListing; 