import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

const CourseForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams(); // Get course ID from URL for editing

  const [form, setForm] = useState({
    title: '',
    description: '',
    mediaUrl: ''
  });
  const [formFile, setFormFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch course data if editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchCourse = async () => {
        try {
          setLoading(true);
          const response = await api.courses.getById(id);
          const course = response.data;
          setForm({
            title: course.title || '',
            description: course.description || '',
            mediaUrl: course.mediaUrl || ''
          });
        } catch (error) {
          setError('Failed to load course data');
          console.error('Error fetching course:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchCourse();
    }
  }, [isEdit, id]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user || !user.id) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setFormFile(null);
        e.target.value = '';
        return;
      }
      setFormFile(file);
      setError('');
    } else {
      setFormFile(null);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!user || !user.id) {
        throw new Error('No user found. Please log in.');
      }

      if (!form.title.trim()) {
        throw new Error('Title is required');
      }
      if (!form.description.trim()) {
        throw new Error('Description is required');
      }

      const formData = new FormData();
      formData.append('Title', form.title.trim());
      formData.append('Description', form.description.trim());
      formData.append('InstructorId', user.id);

      if (form.mediaUrl && form.mediaUrl.trim()) {
        formData.append('MediaUrl', form.mediaUrl.trim());
      }
      if (formFile) {
        formData.append('MediaFile', formFile, formFile.name);
      }

      if (isEdit && id) {
        // Update existing course
        await api.courses.update(id, formData);
        alert('Course updated successfully!');
      } else {
        // Create new course
        await api.courses.create(formData);
        alert('Course created successfully!');
      }
      
      navigate('/courses');
    } catch (error) {
      if (error.response) {
        let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} course.`;
        if (error.response.data && error.response.data.errors) {
          const errors = error.response.data.errors;
          const errorMessages = [];
          Object.keys(errors).forEach(key => {
            if (Array.isArray(errors[key])) {
              errorMessages.push(...errors[key]);
            } else {
              errorMessages.push(errors[key]);
            }
          });
          errorMessage = errorMessages.join('. ');
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        setError(errorMessage);
      } else {
        setError(error.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '90vh' }}>
      <div className="card shadow-lg border-0 p-4" style={{ maxWidth: 500, width: '100%', borderRadius: 18 }}>
        <h2 className="mb-4 text-center fw-bold" style={{ letterSpacing: 1 }}>
          {isEdit ? 'Edit Course' : 'Add New Course'}
        </h2>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Title *</label>
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
            <label className="form-label fw-semibold">Description *</label>
            <textarea
              className="form-control custom-input"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              maxLength={1000}
              placeholder="Course description"
              required
              style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Media URL (Optional)</label>
            <input
              className="form-control custom-input"
              name="mediaUrl"
              value={form.mediaUrl}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
              style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            />
            <div className="form-text ms-1">
              🔗 Provide a YouTube, GeeksforGeeks, or other online learning link
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Upload PDF/Document (Optional)</label>
            <input
              className="form-control custom-input"
              type="file"
              name="mediaFile"
              accept=".pdf,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleFileChange}
              style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            />
            <div className="form-text ms-1">
              📄 Upload course materials: PDF, DOCX, etc. (Max 10MB)
            </div>
            {formFile && (
              <div className="mt-2 text-success">
                ✅ Selected: {formFile.name} ({(formFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 fw-semibold"
            disabled={loading}
            style={{
              borderRadius: 10,
              fontSize: '1.1rem',
              letterSpacing: 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'background 0.2s'
            }}
          >
            <i className={`fas ${isEdit ? 'fa-save' : 'fa-plus'} me-2`}></i>
            {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Course' : 'Create Course')}
          </button>
        </form>
      </div>

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
