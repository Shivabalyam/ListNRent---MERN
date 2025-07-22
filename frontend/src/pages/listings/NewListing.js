import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { BACKEND_URL } from '../../config';

const NewListing = () => {
  const { user } = useContext(UserContext);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    country: '',
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  if (!user) return <p className="alert alert-danger mt-3">You must be logged in to create a listing.</p>;

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
      const res = await fetch(`${BACKEND_URL}/api/listings`, { method: 'POST', credentials: 'include', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create listing');
      navigate('/listings');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="needs-validation mt-3" noValidate encType="multipart/form-data">
      <div className="row">
        <div className="col-8 offset-2">
          <h1>Create a new Listing</h1>
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
            <label htmlFor="imageFile" className="form-label">Upload listing image</label>
            <input type="file" name="image" className="form-control" accept="image/*" required onChange={handleImage} />
            <div className="invalid-feedback">Please upload an image file.</div>
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
          <button type="submit" className="btn btn-dark add-btn">Add</button>
          <br /><br />
        </div>
      </div>
    </form>
  );
};

export default NewListing; 