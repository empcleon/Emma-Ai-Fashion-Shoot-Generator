// components/CalibradorMedidas/IlustracionCuerpo.tsx

import React from 'react';

export const IlustracionHombro: React.FC = () => (
  <svg width="300" height="400" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Silueta de cuerpo */}
    <ellipse cx="150" cy="40" rx="30" ry="35" fill="#FCD34D" stroke="#D97706" strokeWidth="2"/>
    
    {/* Hombros */}
    <line x1="120" y1="75" x2="180" y2="75" stroke="#D97706" strokeWidth="3"/>
    <circle cx="120" cy="75" r="5" fill="#EF4444"/>
    <circle cx="180" cy="75" r="5" fill="#EF4444"/>
    
    {/* Torso */}
    <path d="M 120 75 Q 110 120, 115 150 L 115 200 Q 115 240, 130 280 L 130 350 L 150 380 L 170 350 L 170 280 Q 185 240, 185 200 L 185 150 Q 190 120, 180 75" 
          fill="#FBBF24" stroke="#D97706" strokeWidth="2"/>
    
    {/* Marcadores */}
    <g>
      {/* Hombro */}
      <line x1="120" y1="75" x2="80" y2="75" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5"/>
      <text x="10" y="80" fill="#EF4444" fontSize="14" fontWeight="bold">HOMBRO (inicio)</text>
      
      {/* Pecho */}
      <line x1="150" y1="110" x2="210" y2="110" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5"/>
      <text x="215" y="115" fill="#3B82F6" fontSize="12">Pecho</text>
      
      {/* Cintura */}
      <line x1="115" y1="150" x2="210" y2="150" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="5,5"/>
      <text x="215" y="155" fill="#8B5CF6" fontSize="12">Cintura</text>
      
      {/* Cadera */}
      <line x1="130" y1="190" x2="210" y2="190" stroke="#EC4899" strokeWidth="2" strokeDasharray="5,5"/>
      <text x="215" y="195" fill="#EC4899" fontSize="12">Cadera</text>
      
      {/* Rodilla */}
      <line x1="150" y1="280" x2="210" y2="280" stroke="#10B981" strokeWidth="2" strokeDasharray="5,5"/>
      <text x="215" y="285" fill="#10B981" fontSize="12">Rodilla</text>
      
      {/* Tobillo */}
      <line x1="150" y1="350" x2="210" y2="350" stroke="#F59E0B" strokeWidth="2" strokeDasharray="5,5"/>
      <text x="215" y="355" fill="#F59E0B" fontSize="12">Tobillo</text>
    </g>
    
    {/* Instrucción */}
    <text x="150" y="395" textAnchor="middle" fill="#6B7280" fontSize="11" fontStyle="italic">
      Mide desde el hombro hasta cada punto
    </text>
  </svg>
);

export const IlustracionCintura: React.FC = () => (
  <svg width="300" height="350" viewBox="0 0 300 350" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Torso desde cintura */}
    <path d="M 115 50 Q 110 70, 115 100 L 115 150 Q 115 190, 130 230 L 130 300 L 150 330 L 170 300 L 170 230 Q 185 190, 185 150 L 185 100 Q 190 70, 185 50 Z" 
          fill="#FBBF24" stroke="#D97706" strokeWidth="2"/>
    
    {/* Línea de cintura */}
    <line x1="115" y1="50" x2="185" y2="50" stroke="#EF4444" strokeWidth="3"/>
    <circle cx="115" cy="50" r="5" fill="#EF4444"/>
    <circle cx="185" cy="50" r="5" fill="#EF4444"/>
    
    {/* Marcadores */}
    <g>
      {/* Cintura */}
      <line x1="115" y1="50" x2="80" y2="50" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5"/>
      <text x="10" y="55" fill="#EF4444" fontSize="14" fontWeight="bold">CINTURA (inicio)</text>
      
      {/* Cadera */}
      <line x1="130" y1="90" x2="210" y2="90" stroke="#EC4899" strokeWidth="2" strokeDasharray="5,5"/>
      <text x="215" y="95" fill="#EC4899" fontSize="12">Cadera</text>
      
      {/* Mini */}
      <line x1="150" y1="140" x2="210" y2="140" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="5,5"/>
      <text x="215" y="145" fill="#8B5CF6" fontSize="12">Mini (~52cm)</text>
      
      {/* Rodilla */}
      <line x1="150" y1="180" x2="210" y2="180" stroke="#10B981" strokeWidth="2" strokeDasharray="5,5"/>
      <text x="215" y="185" fill="#10B981" fontSize="12">Rodilla (~60cm)</text>
      
      {/* Pantorrilla */}
      <line x1="150" y1="230" x2="210" y2="230" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5"/>
      <text x="215" y="235" fill="#3B82F6" fontSize="12">Pantorrilla (~75cm)</text>
      
      {/* Tobillo */}
      <line x1="150" y1="300" x2="210" y2="300" stroke="#F59E0B" strokeWidth="2" strokeDasharray="5,5"/>
      <text x="215" y="305" fill="#F59E0B" fontSize="12">Tobillo (~100cm)</text>
    </g>
    
    {/* Instrucción */}
    <text x="150" y="345" textAnchor="middle" fill="#6B7280" fontSize="11" fontStyle="italic">
      Mide desde la cintura hasta cada punto
    </text>
  </svg>
);
