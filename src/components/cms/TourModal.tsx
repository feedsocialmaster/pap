'use client';

import { X, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourModalProps {
  isOpen: boolean;
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  highlight?: string;
  isFirstStep: boolean;
  isLastStep: boolean;
  isTransitioning: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

export function TourModal({
  isOpen,
  step,
  totalSteps,
  title,
  description,
  highlight,
  isFirstStep,
  isLastStep,
  isTransitioning,
  onNext,
  onPrevious,
  onClose,
}: TourModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay con animación */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 z-[9998]"
            onClick={onClose}
          />

          {/* Modal del tour */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-md mx-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-purple-200 dark:border-purple-700 overflow-hidden">
              {/* Header con animación de gradiente */}
              <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_100%] animate-gradient p-4">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
                
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <Sparkles className="w-5 h-5 text-yellow-300" />
                    </motion.div>
                    <div>
                      <p className="text-purple-100 text-xs font-medium">
                        Paso {step + 1} de {totalSteps}
                      </p>
                      <h2 className="text-lg font-bold text-white mt-0.5 leading-tight">
                        {title}
                      </h2>
                    </div>
                  </div>
                  
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all duration-200 transform hover:scale-110 flex-shrink-0"
                    aria-label="Cerrar tour"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Barra de progreso */}
                <div className="relative mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-yellow-300 to-yellow-100 rounded-full shadow-lg"
                  />
                </div>
              </div>

              {/* Contenido con animación */}
              <div className="p-4 space-y-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    {/* Descripción principal */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {description}
                      </p>
                    </div>

                    {/* Highlight destacado */}
                    {highlight && (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-3 border-l-4 border-yellow-500 shadow-sm"
                      >
                        <div className="flex items-start gap-2">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.2, 1],
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="flex-shrink-0"
                          >
                            <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          </motion.div>
                          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                            💡 {highlight}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Indicador de transición */}
                    {isTransitioning && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center gap-2 py-2"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Navegando...
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer con botones */}
              <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onPrevious}
                  disabled={isFirstStep || isTransitioning}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>

                <div className="flex gap-1.5">
                  {Array.from({ length: totalSteps }).map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        index === step
                          ? 'bg-purple-600 w-6'
                          : index < step
                          ? 'bg-purple-400'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {!isLastStep ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onNext}
                    disabled={isTransitioning}
                    className="flex items-center gap-1 px-4 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="flex items-center gap-1 px-4 py-1.5 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    Finalizar
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
