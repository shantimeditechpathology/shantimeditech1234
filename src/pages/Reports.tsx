import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Report } from '../types';
import { FileText, Download, Clock, CheckCircle2, Search, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reports'),
      where('userUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(reportsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reports');
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight mb-2">My Reports</h1>
        <p className="text-neutral-500">Access and download your diagnostic test results securely.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-neutral-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {reports.length > 0 ? (
            reports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-4 rounded-2xl ${report.status === 'ready' ? 'bg-green-50' : 'bg-orange-50'}`}>
                      <FileText className={`h-8 w-8 ${report.status === 'ready' ? 'text-green-600' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900">Report #{report.id.slice(-6).toUpperCase()}</h3>
                      <p className="text-sm text-neutral-500">Generated on {format(new Date(report.createdAt), 'PPP')}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {report.status === 'ready' ? (
                        <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full">
                          <CheckCircle2 className="h-4 w-4 mr-2" /> READY
                        </span>
                      ) : (
                        <span className="flex items-center text-xs font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-full">
                          <Clock className="h-4 w-4 mr-2" /> PENDING
                        </span>
                      )}
                    </div>

                    {report.status === 'ready' && (
                      <div className="flex space-x-3">
                        {report.fileUrl && (
                          <a
                            href={report.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-md"
                          >
                            <Download className="h-5 w-5" />
                            <span>Download</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
              <div className="bg-neutral-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-neutral-300" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">No reports found</h3>
              <p className="text-neutral-500">Your reports will appear here once they are ready.</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-12 bg-blue-50 p-8 rounded-3xl border border-blue-100">
        <h3 className="text-lg font-bold text-blue-900 mb-2">Need help with your reports?</h3>
        <p className="text-blue-700 text-sm mb-6">If you are unable to find a report or have questions about your results, please contact our support team.</p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <a href="tel:+919876543210" className="bg-white text-blue-600 px-6 py-2 rounded-xl font-bold text-sm border border-blue-200 hover:bg-blue-100 transition-all text-center">
            Call Support
          </a>
          <a href="mailto:support@shantimeditech.com" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all text-center">
            Email Us
          </a>
        </div>
      </div>
    </div>
  );
}
