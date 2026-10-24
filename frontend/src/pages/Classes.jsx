import React, { useEffect, useState } from 'react';
import { classService } from '../services/classService';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { BookOpen, Plus, Edit, Trash2, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Classes = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editClassObj, setEditClassObj] = useState(null);
  const initialAddFormData = {
    name: '',
    section: '',
    academicYear: '2026-2027',
    subject: '',
    departmentId: '',
    teacherIds: [],
    lectures: [{ code: '', name: '', teacherId: '' }]
  };
  const [addFormData, setAddFormData] = useState(initialAddFormData);
  const [editFormData, setEditFormData] = useState({
    name: '',
    section: '',
    academicYear: '2026-2027',
    subject: ''
  });
  const [addModalError, setAddModalError] = useState('');
  const [editModalError, setEditModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClasses();
    if (user?.role === 'hod' || user?.role === 'admin') {
      classService.getAssignableTeachers()
        .then((res) => {
          if (res.success) setTeachers(res.data);
        })
        .catch((err) => console.error(err));
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await classService.getClasses();
      if (res.success) {
        setClasses(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setAddModalError('');
    setSubmitting(true);
    try {
      const res = await classService.createClass(addFormData);
      if (res.success) {
        setAddModalOpen(false);
        setAddFormData(initialAddFormData);
        fetchClasses();
      }
    } catch (err) {
      setAddModalError(err.response?.data?.message || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    if (!editClassObj) return;
    setEditModalError('');
    setSubmitting(true);
    try {
      const res = await classService.updateClass(editClassObj._id, editFormData);
      if (res.success) {
        setEditClassObj(null);
        fetchClasses();
      }
    } catch (err) {
      setEditModalError(err.response?.data?.message || 'Failed to update class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id, name) => {
    if (!window.confirm(`Deactivate class section ${name}?`)) return;
    try {
      await classService.deleteClass(id);
      fetchClasses();
    } catch (err) {
      alert('Failed to deactivate class');
    }
  };

  const openAddModal = () => {
    setAddFormData({
      ...initialAddFormData,
      departmentId: user?.role === 'hod' ? (user.departmentIds?.[0] || '') : '',
    });
    setAddModalError('');
    setAddModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditClassObj(c);
    setEditFormData({
      name: c.name || '',
      section: c.section || '',
      academicYear: c.academicYear || '2026-2027',
      subject: c.subject || ''
    });
    setEditModalError('');
  };

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Class & Course Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">Academic sections, course assignments & student rosters</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Add New Class
        </button>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <LoadingSpinner text="Loading class sections..." />
      ) : classes.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-500 rounded-3xl">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold">No classes configured</p>
          <p className="text-xs text-slate-500 mt-1">Create your first class section to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls._id} className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold rounded-xl uppercase">
                    Section {cls.section}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(cls)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Edit Class"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClass(cls._id, `${cls.name} (${cls.section})`)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                      title="Deactivate Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight">{cls.name}</h3>
                <p className="text-xs text-blue-400 font-semibold mt-0.5">{cls.subjectIds?.length || 1} lectures assigned</p>
                <p className="text-[11px] text-slate-400 mt-2">Academic Year: {cls.academicYear} · {cls.course || 'BCA'}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(cls.subjectIds && cls.subjectIds.length > 0 ? cls.subjectIds : [{ name: cls.subject }])
                    .filter(Boolean)
                    .map((item, idx) => (
                      <span key={item._id || item.code || item.name || idx} className="px-2 py-1 text-[10px] rounded-md bg-slate-900 text-slate-300 border border-slate-700">
                        {item.code || item.name || 'Subject'}
                      </span>
                    ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <Link
                  to={`/students?classId=${cls._id}`}
                  className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4 text-blue-400" /> View Class Students
                </Link>
                <Link
                  to={`/take-attendance?classId=${cls._id}`}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition"
                >
                  Take Attendance
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Class Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Create New Class Section">
        <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
          {addModalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addModalError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Class / Degree Name</label>
            <input
              type="text"
              required
              value={addFormData.name}
              onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
              placeholder="e.g. BCA 3rd Year"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Section</label>
            <input
              type="text"
              required
              value={addFormData.section}
              onChange={(e) => setAddFormData({ ...addFormData, section: e.target.value.toUpperCase() })}
              placeholder="e.g. A"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Subject / Course Name</label>
            <input
              type="text"
              required
              value={addFormData.subject}
              onChange={(e) => setAddFormData({ ...addFormData, subject: e.target.value })}
              placeholder="e.g. Computer Networks (BCA-501)"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">Lectures from timetable</label>
              <button
                type="button"
                onClick={() => setAddFormData({ ...addFormData, lectures: [...(addFormData.lectures || []), { code: '', name: '', teacherId: '' }] })}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                + Add lecture
              </button>
            </div>
            {(addFormData.lectures || []).map((lecture, index) => (
              <div key={`${index}-${lecture.code}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[0.7fr_1.5fr_1.2fr_auto]">
                <input
                  required={index === 0 || lecture.name.length > 0}
                  value={lecture.code}
                  onChange={(e) => setAddFormData({ ...addFormData, lectures: addFormData.lectures.map((item, itemIndex) => itemIndex === index ? { ...item, code: e.target.value } : item) })}
                  placeholder="Code e.g. BCA-501"
                  className="min-w-0 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  required={index === 0 || lecture.code.length > 0}
                  value={lecture.name}
                  onChange={(e) => setAddFormData({ ...addFormData, lectures: addFormData.lectures.map((item, itemIndex) => itemIndex === index ? { ...item, name: e.target.value } : item) })}
                  placeholder="Lecture name e.g. Introduction to DBMS"
                  className="min-w-0 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
                <select
                  value={lecture.teacherId}
                  onChange={(e) => setAddFormData({ ...addFormData, lectures: addFormData.lectures.map((item, itemIndex) => itemIndex === index ? { ...item, teacherId: e.target.value } : item) })}
                  className="min-w-0 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Faculty</option>
                  {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.fullName}</option>)}
                </select>
                <button
                  type="button"
                  disabled={(addFormData.lectures?.length || 0) <= 1}
                  onClick={() => setAddFormData({ ...addFormData, lectures: addFormData.lectures.filter((_, itemIndex) => itemIndex !== index) })}
                  className="px-2 text-rose-400 disabled:text-slate-700"
                  aria-label="Remove lecture"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Academic Year</label>
            <input
              type="text"
              required
              value={addFormData.academicYear}
              onChange={(e) => setAddFormData({ ...addFormData, academicYear: e.target.value })}
              placeholder="e.g. 2026-2027"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {(user?.role === 'hod' || user?.role === 'admin') && (
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Assign Teacher</label>
              <select
                required={user?.role === 'hod'}
                value={addFormData.teacherIds?.[0] || ''}
                onChange={(e) => setAddFormData({ ...addFormData, teacherIds: e.target.value ? [e.target.value] : [] })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select a teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>{teacher.fullName} ({teacher.email})</option>
                ))}
              </select>
              {teachers.length === 0 && <p className="text-[11px] text-amber-300 mt-1">No active teachers are assigned to your department.</p>}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25"
            >
              {submitting ? 'Creating...' : 'Save Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Class Modal */}
      <Modal isOpen={!!editClassObj} onClose={() => setEditClassObj(null)} title="Update Class Details">
        <form onSubmit={handleUpdateClass} className="space-y-4 text-xs">
          {editModalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editModalError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Class Name</label>
            <input
              type="text"
              required
              value={editFormData.name || ''}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Section</label>
            <input
              type="text"
              required
              value={editFormData.section || ''}
              onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Subject</label>
            <input
              type="text"
              required
              value={editFormData.subject || ''}
              onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Academic Year</label>
            <input
              type="text"
              required
              value={editFormData.academicYear || ''}
              onChange={(e) => setEditFormData({ ...editFormData, academicYear: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditClassObj(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Classes;
