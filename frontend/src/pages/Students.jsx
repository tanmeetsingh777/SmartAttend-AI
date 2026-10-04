import React, { useEffect, useState } from 'react';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import FaceEnrollmentModal from '../components/FaceEnrollmentModal';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ResponsiveSelect from '../components/ResponsiveSelect';
import { Users, Search, Plus, Camera, Edit, Trash2, CheckCircle2, XCircle, AlertCircle, Eye, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Modals
  const [enrollStudent, setEnrollStudent] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [formData, setFormData] = useState({ rollNumber: '', fullName: '', email: '', classId: '' });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, selectedClass, statusFilter, showInactive]);

  const fetchClasses = async () => {
    try {
      const res = await classService.getClasses();
      if (res.success) {
        setClasses(res.data);
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Unable to load classes.');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedClass) params.classId = selectedClass;
      if (statusFilter) params.status = statusFilter;
      if (showInactive) params.includeInactive = 'true';

      const res = await studentService.getStudents(params);
      if (res.success) {
        setStudents(res.data);
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Unable to load students.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      const res = await studentService.createStudent(formData);
      if (res.success) {
        setAddModalOpen(false);
        setFormData({ rollNumber: '', fullName: '', email: '', classId: '' });
        await fetchStudents();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editStudent) return;
    setModalError('');
    setSubmitting(true);
    try {
      const res = await studentService.updateStudent(editStudent._id, formData);
      if (res.success) {
        setEditStudent(null);
        await fetchStudents();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate student ${name}?`)) return;
    try {
      await studentService.deleteStudent(id);
      await fetchStudents();
    } catch (err) {
      alert('Failed to delete student');
    }
  };

  const handleRestoreStudent = async (id) => {
    try {
      await studentService.restoreStudent(id);
      await fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore student');
    }
  };

  const openAddModal = () => {
    setFormData({ rollNumber: '', fullName: '', email: '', classId: classes[0]?._id || '' });
    setModalError('');
    setAddModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditStudent(student);
    setFormData({
      rollNumber: student.rollNumber,
      fullName: student.fullName,
      email: student.email,
      classId: student.classId?._id || student.classId
    });
    setModalError('');
  };

  return (
    <div className="space-y-6 pb-12">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Student Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage student profiles, class assignments & face enrollments</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Add New Student
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, roll number, email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <ResponsiveSelect value={selectedClass} onChange={setSelectedClass} className="w-full md:w-64" options={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c._id, label: `${c.name} (${c.section}) - ${c.subject}` }))]} />

          <ResponsiveSelect value={statusFilter} onChange={setStatusFilter} className="w-full md:w-44" options={[{ value: '', label: 'All Face Statuses' }, { value: 'enrolled', label: 'Enrolled' }, { value: 'not_enrolled', label: 'Not Enrolled' }]} />

          <label className="inline-flex items-center gap-2 px-3 py-2 text-xs text-slate-300">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Show inactive
          </label>
        </div>

      </div>

      {/* Students Table */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        {fetchError && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">{fetchError}</div>}
        {loading ? (
          <LoadingSpinner text="Fetching students..." />
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold">No students found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting search parameters or add a student above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="students-table w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class / Section</th>
                  <th className="py-3 px-4">Face Biometrics</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((st) => {
                  const isEnrolled = st.faceEnrollment?.status === 'enrolled';
                  return (
                    <tr key={st._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{st.rollNumber}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{st.fullName}</p>
                        <p className="text-[10px] text-slate-400">{st.email}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {st.classId ? `${st.classId.name} (${st.classId.section})` : 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isEnrolled ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Enrolled (128-dim)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <XCircle className="w-3 h-3" /> Not Enrolled
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEnrollStudent(st)}
                            title="Enroll Face Data"
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            {isEnrolled ? 'Re-enroll' : 'Enroll Face'}
                          </button>

                          <Link
                            to={`/students/${st._id}`}
                            title="View Full Profile"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => openEditModal(st)}
                            title="Edit Student"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {st.isActive ? (
                            <button onClick={() => handleDeleteStudent(st._id, st.fullName)} title="Deactivate Student" className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-xl transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => handleRestoreStudent(st._id)} title="Restore Student" className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 rounded-xl transition">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Face Enrollment Modal */}
      {enrollStudent && (
        <FaceEnrollmentModal
          student={enrollStudent}
          onClose={() => setEnrollStudent(null)}
          onEnrollmentSuccess={() => {
            fetchStudents();
          }}
        />
      )}

      {/* Add Student Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Register New Student">
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Roll Number (Unique)</label>
            <input
              type="text"
              required
              value={formData.rollNumber}
              onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
              placeholder="e.g. BCA2025006"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Rajesh Sharma"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="student@university.edu"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Assigned Class</label>
            <ResponsiveSelect value={formData.classId} onChange={(value) => setFormData({ ...formData, classId: value })} options={classes.map(c => ({ value: c._id, label: `${c.name} (${c.section}) - ${c.subject}` }))} />
          </div>

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
              {submitting ? 'Creating...' : 'Save Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={!!editStudent} onClose={() => setEditStudent(null)} title="Update Student Profile">
        <form onSubmit={handleUpdateStudent} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Roll Number</label>
            <input
              type="text"
              required
              value={formData.rollNumber}
              onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Assigned Class</label>
            <ResponsiveSelect value={formData.classId} onChange={(value) => setFormData({ ...formData, classId: value })} options={classes.map(c => ({ value: c._id, label: `${c.name} (${c.section}) - ${c.subject}` }))} />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditStudent(null)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25"
            >
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Students;
