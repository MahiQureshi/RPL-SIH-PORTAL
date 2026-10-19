import React, { useState, useEffect } from 'react';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Input, Textarea, Select } from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { api } from '../../services/api';
import { offlineStorage } from '../../services/indexedDB';
import {
  Wrench,
  CheckCircle,
  Save,
  ArrowRight,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  HardHat
} from 'lucide-react';
import './SkillDeclaration.css';

const DEFAULT_TOOLS = [
  "Digital Multimeter",
  "Megger (Insulation Tester)",
  "Combination Pliers",
  "Wire Stripper & Crimping Tool",
  "Conduit Pipe Bender",
  "Non-contact Phase Tester",
  "Fish Tape (Pull Wire)",
  "Insulated Screwdriver Set (1000V)",
  "Hacksaw & Conduit Reamer",
  "Earth Tester Kit"
];

const DEFAULT_TASKS = [
  "Surface and concealed PVC conduit laying in new houses",
  "Distribution Board (DB) mounting and MCB circuit wiring",
  "Earth pit electrode connection and earth wire routing",
  "Troubleshooting household short-circuits and tripping MCBs",
  "Replacing burned switchboards, socket outlets and ceiling fan regulators",
  "Single-phase and three-phase energy meter termination",
  "Performing insulation resistance test across conductors"
];

export default function SkillDeclaration({ onDeclarationSubmitted }) {
  const [tradeCategory, setTradeCategory] = useState("Electrical Installation & Repair");
  const [yearsExperience, setYearsExperience] = useState(6.5);
  const [selectedTools, setSelectedTools] = useState([
    "Digital Multimeter",
    "Megger (Insulation Tester)",
    "Combination Pliers",
    "Wire Stripper & Crimping Tool",
    "Conduit Pipe Bender"
  ]);
  const [selectedTasks, setSelectedTasks] = useState([
    "Surface and concealed PVC conduit laying in new houses",
    "Distribution Board (DB) mounting and MCB circuit wiring",
    "Earth pit electrode connection and earth wire routing",
    "Troubleshooting household short-circuits and tripping MCBs"
  ]);
  const [informalTraining, setInformalTraining] = useState(
    "Apprenticed under senior certified electrician Master Ram Swaroop for 3 years at Varanasi construction sites."
  );
  const [workEnvironment, setWorkEnvironment] = useState("Residential houses and small commercial renovation sites.");
  const [customTask, setCustomTask] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Load existing declaration on mount
  useEffect(() => {
    async function loadDecl() {
      try {
        // Try local offline draft first
        const localDraft = await offlineStorage.getDraft('worker_declaration_draft');
        if (localDraft) {
          setTradeCategory(localDraft.trade_category || tradeCategory);
          setYearsExperience(localDraft.years_experience || yearsExperience);
          setSelectedTools(localDraft.tools_used || selectedTools);
          setSelectedTasks(localDraft.tasks_performed || selectedTasks);
          setInformalTraining(localDraft.informal_training || informalTraining);
          setWorkEnvironment(localDraft.work_environment || workEnvironment);
          return;
        }

        const res = await api.getMyDeclaration();
        if (res.has_declaration && res.declaration) {
          const d = res.declaration;
          setTradeCategory(d.trade_category);
          setYearsExperience(d.years_experience);
          setSelectedTools(d.tools_used || []);
          setSelectedTasks(d.tasks_performed || []);
          setInformalTraining(d.informal_training || "");
          setWorkEnvironment(d.work_environment || "");
        }
      } catch (err) {
        console.warn('Could not load declaration:', err);
      }
    }
    loadDecl();
  }, []);

  const toggleTool = (tool) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const toggleTask = (task) => {
    setSelectedTasks((prev) =>
      prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
    );
  };

  const addCustomTask = () => {
    if (customTask.trim() && !selectedTasks.includes(customTask.trim())) {
      setSelectedTasks([...selectedTasks, customTask.trim()]);
      setCustomTask("");
    }
  };

  const removeTask = (taskToRemove) => {
    setSelectedTasks(selectedTasks.filter((t) => t !== taskToRemove));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    const draftPayload = {
      trade_category: tradeCategory,
      years_experience: parseFloat(yearsExperience),
      tools_used: selectedTools,
      tasks_performed: selectedTasks,
      informal_training: informalTraining,
      work_environment: workEnvironment,
      status: "DRAFT"
    };

    // Save to IndexedDB locally
    await offlineStorage.saveDraft('worker_declaration_draft', draftPayload);

    // If online, also save to backend
    if (navigator.onLine) {
      try {
        await api.saveDeclaration(draftPayload);
      } catch (e) {
        console.warn('Backend sync deferred (working offline)');
      }
    }

    setSaving(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const submitPayload = {
      trade_category: tradeCategory,
      years_experience: parseFloat(yearsExperience),
      tools_used: selectedTools,
      tasks_performed: selectedTasks,
      informal_training: informalTraining,
      work_environment: workEnvironment,
      status: "SUBMITTED"
    };

    // Save locally
    await offlineStorage.saveDraft('worker_declaration_draft', submitPayload);

    try {
      await api.saveDeclaration(submitPayload);
      if (onDeclarationSubmitted) {
        onDeclarationSubmitted(submitPayload);
      }
    } catch (err) {
      alert(`Submission error: ${err.message}. Saved locally in offline cache.`);
      if (onDeclarationSubmitted) {
        onDeclarationSubmitted(submitPayload);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="declaration-page animate-fade-in">
      <div className="declaration-header">
        <Badge variant="sky">Screen 09 • Structured Self-Declaration</Badge>
        <h2 className="declaration-title">Declare Your Practical Work Experience</h2>
        <p className="declaration-subtitle">
          Declare your hands-on trade duration, equipment used, and everyday job activities. This data is evaluated against verified NCVET qualification packs without requiring formal school credentials.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="declaration-form">
        {/* Step 1: Trade & Duration */}
        <Card variant="solid">
          <CardHeader
            title="1. Trade Track & Practical Duration"
            subtitle="Specify the occupational field you practice and total years of hands-on experience."
          />
          <CardBody>
            <div className="grid grid-cols-1 grid-cols-2-sm gap-4">
              <Select
                label="Primary Occupational Trade"
                value={tradeCategory}
                onChange={(e) => setTradeCategory(e.target.value)}
                options={[
                  { value: "Electrical Installation & Repair", label: "Electrical Installation & Repair (CON/Q0601 Track)" },
                  { value: "Field Technician - Home Appliances", label: "Field Technician - Home Appliances (ELE/Q3102 Track)" },
                  { value: "Automotive Service & Repair", label: "Automotive Service & Repair (ASC/Q1402 Track)" },
                  { value: "Masonry & Civil Construction", label: "Masonry & Civil Construction (CON/Q0102 Track)" }
                ]}
              />

              <div className="form-group">
                <label className="form-label">
                  Total Practical Experience: <span className="text-sky font-bold">{yearsExperience} Years</span>
                </label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="0.5"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(parseFloat(e.target.value))}
                    className="experience-slider"
                  />
                  <div className="slider-ticks">
                    <span>1 yr (Level 3 ready)</span>
                    <span>3 yrs (Level 4 benchmark)</span>
                    <span>10+ yrs (Master Craftsman)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Step 2: Tools & Equipment */}
        <Card variant="solid">
          <CardHeader
            title="2. Trade Tools & Instruments You Operate Independently"
            subtitle="Check every instrument you are experienced with. These are mapped directly to official performance criteria."
          />
          <CardBody>
            <div className="tools-checklist-grid">
              {DEFAULT_TOOLS.map((tool) => {
                const isSelected = selectedTools.includes(tool);
                return (
                  <button
                    type="button"
                    key={tool}
                    className={`tool-pill-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleTool(tool)}
                  >
                    <CheckCircle
                      size={16}
                      className={isSelected ? "text-sky" : "text-slate"}
                    />
                    <span>{tool}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted">
              Selected: <span className="text-sky font-bold">{selectedTools.length} verified trade tools</span>
            </p>
          </CardBody>
        </Card>

        {/* Step 3: Tasks Performed */}
        <Card variant="solid">
          <CardHeader
            title="3. Practical Job Tasks Performed"
            subtitle="Select the technical operations you routinely perform on job sites."
          />
          <CardBody>
            <div className="tasks-checklist">
              {DEFAULT_TASKS.map((task) => {
                const isSelected = selectedTasks.includes(task);
                return (
                  <label key={task} className={`task-checkbox-item ${isSelected ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTask(task)}
                    />
                    <span className="task-text">{task}</span>
                  </label>
                );
              })}

              {/* Custom Tasks Added */}
              {selectedTasks
                .filter((t) => !DEFAULT_TASKS.includes(t))
                .map((custom) => (
                  <div key={custom} className="custom-task-item">
                    <span>{custom}</span>
                    <button
                      type="button"
                      className="remove-task-btn"
                      onClick={() => removeTask(custom)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
            </div>

            {/* Add Custom Task Input */}
            <div className="add-task-row mt-4">
              <Input
                placeholder="Add other tasks performed (e.g. Solar rooftop inverter wiring)..."
                value={customTask}
                onChange={(e) => setCustomTask(e.target.value)}
                className="mb-0 flex-1"
              />
              <Button type="button" variant="secondary" icon={Plus} onClick={addCustomTask}>
                Add Task
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Step 4: Apprenticeship & Environment */}
        <Card variant="solid">
          <CardHeader
            title="4. Work Environment & Informal Apprenticeship"
            subtitle="Document who trained you informally and the physical conditions of your work."
          />
          <CardBody>
            <div className="grid grid-cols-1 grid-cols-2-sm gap-4">
              <Textarea
                label="Informal Apprenticeship / Master Craftsman Mentorship"
                rows={3}
                value={informalTraining}
                onChange={(e) => setInformalTraining(e.target.value)}
                placeholder="Mention senior technicians or contractors under whom you learned..."
              />
              <Textarea
                label="Typical Work Environment"
                rows={3}
                value={workEnvironment}
                onChange={(e) => setWorkEnvironment(e.target.value)}
                placeholder="Describe sites (e.g. New building construction, residential repair, maintenance)..."
              />
            </div>
          </CardBody>
          <CardFooter>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                icon={Save}
                loading={saving}
                onClick={handleSaveDraft}
              >
                Save Draft (Offline Ready)
              </Button>
              {savedNotice && (
                <span className="text-emerald text-xs font-semibold animate-fade-in">
                  ✓ Saved to Local Storage & Database
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Sparkles}
              iconPosition="right"
              loading={saving}
            >
              Submit & Match Qualifications
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
