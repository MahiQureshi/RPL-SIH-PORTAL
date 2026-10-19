import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardBody } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { api } from '../../services/api';
import { Scale, Users, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import './ConsistencyAnalytics.css';

export default function ConsistencyAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getConsistencyAnalytics();
      setData(res);
    } catch (err) {
      console.error('Error loading consistency analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="text-center p-12">Computing Chance-Corrected Inter-Assessor Reliability...</div>;
  }

  if (!data) {
    return <div className="text-center p-8">Unable to calculate consistency analytics.</div>;
  }

  const matrix = data.confusion_matrix || {};
  const categories = ['COMPETENT', 'PARTIALLY_DEMONSTRATED', 'NOT_DEMONSTRATED'];

  return (
    <div className="consistency-page animate-fade-in">
      <div className="consistency-header">
        <div className="flex justify-between items-center">
          <div>
            <Badge variant="emerald">Screen 35 • Inter-Assessor Reliability</Badge>
            <h2 className="consistency-title">Assessor Consistency & Rubric Calibration</h2>
          </div>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadAnalytics}>
            Recalculate
          </Button>
        </div>
        <p className="consistency-subtitle">
          Statistical agreement analysis across independent, blinded dual-assessor evaluations on identical candidate evidence sets.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-metrics-grid">
        <div className="kpi-card glass-panel">
          <span className="kpi-label">Cohen's Kappa (κ)</span>
          <span className="kpi-val text-sky">{data.cohens_kappa}</span>
          <span className="kpi-meta text-emerald">Chance-Corrected Reliability</span>
        </div>

        <div className="kpi-card glass-panel">
          <span className="kpi-label">Exact Agreement</span>
          <span className="kpi-val text-emerald">{data.exact_agreement_pct}%</span>
          <span className="kpi-meta">1-to-1 Identical Scores</span>
        </div>

        <div className="kpi-card glass-panel">
          <span className="kpi-label">Adjacent Agreement</span>
          <span className="kpi-val text-gold">{data.adjacent_agreement_pct}%</span>
          <span className="kpi-meta">Within ±1 Scoring Step</span>
        </div>

        <div className="kpi-card glass-panel">
          <span className="kpi-label">Sample Size (N)</span>
          <span className="kpi-val text-primary">{data.sample_size} Trials</span>
          <span className="kpi-meta">{data.criteria_evaluated} Standard Criteria</span>
        </div>
      </div>

      {/* Interpretation Alert Box */}
      <div className="interpretation-box glass-panel">
        <ShieldCheck size={24} className="text-emerald flex-shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-primary">
            Statistical Interpretation: {data.interpretation}
          </h4>
          <p className="text-xs text-secondary mt-1">
            Expected chance agreement is {data.chance_expected_agreement_pct}%. With an observed Kappa of{' '}
            <strong>{data.cohens_kappa}</strong>, the standardized guided rubric demonstrably mitigates subjective examiner drift.
          </p>
        </div>
      </div>

      {/* Confusion Matrix Table */}
      <Card variant="solid" className="mt-6">
        <CardHeader
          title="Dual-Assessor Confusion Matrix"
          subtitle={`Compared Assessors: ${data.assessors_compared?.join(' vs. ')}`}
        />
        <CardBody>
          <div className="matrix-table-wrapper">
            <table className="confusion-matrix-table">
              <thead>
                <tr>
                  <th rowSpan="2" className="corner-header">Assessor 1 Rating ↓ \ Assessor 2 Rating →</th>
                  <th colSpan="3" className="center-header">Assessor 2: Rajesh Varma</th>
                </tr>
                <tr>
                  <th>Competent</th>
                  <th>Partially Dem.</th>
                  <th>Not Dem.</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c1) => (
                  <tr key={c1}>
                    <td className="row-header">
                      <strong>{c1.replace(/_/g, ' ')}</strong>
                    </td>
                    {categories.map((c2) => {
                      const count = matrix[c1]?.[c2] || 0;
                      const isDiagonal = c1 === c2;
                      return (
                        <td
                          key={c2}
                          className={`matrix-cell ${isDiagonal ? 'diagonal-match' : count > 0 ? 'off-diagonal' : ''}`}
                        >
                          {count}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-muted">
            * Diagonal cells represent complete agreement between both examiners. Data source:{' '}
            {data.evaluation_dataset_note}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
