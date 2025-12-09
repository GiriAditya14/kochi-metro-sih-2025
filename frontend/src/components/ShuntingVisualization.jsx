import { useState, useEffect } from 'react';
import { Train, Clock, Zap, AlertTriangle } from 'lucide-react';

const ShuntingVisualization = ({ params, results }) => {
  const [animatedLayout, setAnimatedLayout] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Generate initial track layout based on parameters
  useEffect(() => {
    if (params) {
      const layout = generateTrackLayout(params);
      setAnimatedLayout(layout);
      setCurrentStep(0);
    }
  }, [params]);

  // Animate through move sequence if results are available
  useEffect(() => {
    if (results?.move_sequence && results.move_sequence.length > 0) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < results.move_sequence.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2000); // Change every 2 seconds

      return () => clearInterval(interval);
    }
  }, [results]);

  const generateTrackLayout = (params) => {
    // Generate a realistic depot layout with trains
    const numTracks = 8;
    const trainsPerTrack = Math.floor(Math.random() * 3) + 2; // 2-4 trains per track
    
    const tracks = [];
    const trainIds = ['TS-201', 'TS-202', 'TS-203', 'TS-204', 'TS-205', 'TS-206', 'TS-207', 'TS-208', 
                      'TS-209', 'TS-210', 'TS-211', 'TS-212', 'TS-213', 'TS-214', 'TS-215', 'TS-216'];
    
    let trainIndex = 0;
    
    for (let i = 0; i < numTracks; i++) {
      const trains = [];
      const numTrainsOnTrack = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numTrainsOnTrack && trainIndex < trainIds.length; j++) {
        trains.push({
          id: trainIds[trainIndex],
          position: j,
          status: Math.random() > 0.7 ? 'blocked' : 'ready',
          needsMove: Math.random() > 0.6,
        });
        trainIndex++;
      }
      
      tracks.push({
        id: `T${i + 1}`,
        name: `Track ${i + 1}`,
        trains,
        capacity: 4,
      });
    }
    
    return tracks;
  };

  const getTrainColor = (train, isMoving) => {
    if (isMoving) return 'from-yellow-500 to-amber-600 animate-pulse';
    if (train.needsMove) return 'from-orange-500 to-red-600';
    if (train.status === 'blocked') return 'from-red-500 to-red-700';
    return 'from-emerald-500 to-green-600';
  };

  const getTrainIcon = (train) => {
    if (train.needsMove) return <AlertTriangle className="w-3 h-3" />;
    return <Train className="w-3 h-3" />;
  };

  // Apply current move step to layout
  const getCurrentLayout = () => {
    if (!animatedLayout) return [];
    if (!results?.move_sequence || currentStep === 0) return animatedLayout;

    // Clone the layout
    const layout = JSON.parse(JSON.stringify(animatedLayout));
    
    // Apply moves up to current step
    for (let i = 0; i <= currentStep && i < results.move_sequence.length; i++) {
      const move = results.move_sequence[i];
      // Simulate the move (simplified)
      // In a real implementation, you'd parse the action and update positions
    }
    
    return layout;
  };

  const currentLayout = getCurrentLayout();
  const currentMove = results?.move_sequence?.[currentStep];

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="bg-slate-200/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-300/50 dark:border-slate-700/50">