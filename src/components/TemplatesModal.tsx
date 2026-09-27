import React from 'react';
import { X, Network, Grid, CheckSquare, Sparkles, ArrowRight } from 'lucide-react';
import { allTemplates } from '../templates/defaultTemplates';
import { TemplateDefinition } from '../types';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: TemplateDefinition, replace: boolean) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Network':
        return <Network className="w-5 h-5 text-indigo-400" />;
      case 'Grid':
        return <Grid className="w-5 h-5 text-emerald-400" />;
      case 'CheckSquare':
        return <CheckSquare className="w-5 h-5 text-cyan-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Strategy & Architecture Blueprints
              </h2>
              <p className="text-xs text-slate-400">
                Instantly populate your SDS Geox whiteboard with enterprise-grade frameworks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {allTemplates.map((template) => (
            <div
              key={template.id}
              className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                  {getIcon(template.icon)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                      {template.name}
                    </h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
                    {template.description}
                  </p>
                  <div className="text-[11px] text-indigo-400 font-mono mt-1.5">
                    {template.elements.length} components included
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    onApplyTemplate(template, true);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <span>Load Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    onApplyTemplate(template, false);
                    onClose();
                  }}
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
                >
                  Append Below
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
