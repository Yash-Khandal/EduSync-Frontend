import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const CourseForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    mediaUrl: ''
  });
  const [formFile, setFormFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = e => {
    setFormFile(e.target.files[0]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('instructorId', user.id);
      formData.append('mediaUrl', form.mediaUrl);
      if (formFile) {
        formData.append('mediaFile', formFile);
      }

      await api.courses.create(formData);
      alert('Course created!');
      navigate('/courses');
    } catch (error) {
      alert('Failed to create course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '90vh' }}>
      <div className="card shadow-lg border-0 p-4" style={{ maxWidth: 500, width: '100%', borderRadius: 18 }}>
        <h2 className="mb-4 text-center fw-bold" style={{ letterSpacing: 1 }}>Add New Course</h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-3">
            <label className="form-label fw-semibold">Title</label>
            <input
              className="form-control custom-input"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder="Course title"
              autoFocus
              style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Description</label>
            <textarea
              className="form-control custom-input"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              maxLength={1000}
              placeholder="Course description"
              style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Media URL</label>
            <input
              className="form-control custom-input"
              name="mediaUrl"
              value={form.mediaUrl}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
              style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            />
            <div className="form-text ms-1">
              Optionally provide a YouTube, GFG, or other online link.
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Upload PDF/CSV/Other File</label>
            <input
              className="form-control custom-input"
              type="file"
              name="mediaFile"
              accept=".pdf,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleFileChange}
              style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            />
            <div className="form-text ms-1">
              Or upload a PDF, CSV, DOCX, etc. (optional)
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100 fw-semibold"
            style={{
              borderRadius: 10,
              fontSize: '1.1rem',
              letterSpacing: 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'background 0.2s'
            }}
          >
            <i className="fas fa-plus me-2"></i>
            Create Course
          </button>
        </form>
      </div>
      {/* Extra styling for modern look */}
      <style>{`
        .custom-input:focus {
          border-color: #3b2fd1;
          box-shadow: 0 0 0 0.15rem rgba(59,47,209,0.13);
        }
        .card {
          background: #fff;
        }
      `}</style>
    </div>
  );
};

export default CourseForm;
