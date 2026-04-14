import React, { useState, useRef, useEffect } from 'react';

const MultiSelect = ({ label, options, selectedValues, onChange, placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    onChange([...filteredOptions]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) return selectedValues[0];
    return `${selectedValues.length} selected`;
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="filter-group">
      <label className="filter-label">{label}</label>
      <div className="multi-select-container" ref={dropdownRef}>
        <div
          className={`multi-select-header ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={`selected-values ${selectedValues.length === 0 ? 'placeholder' : ''}`}>
            {getDisplayText()}
          </span>
          <div className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
        </div>
        
        {isOpen && (
          <div className="multi-select-dropdown">
            {/* Search Field */}
            <div className="multi-select-search">
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Select All / Clear All Buttons */}
            <div className="multi-select-actions">
              <button
                className="action-btn select-all-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAll();
                }}
              >
                Select All
              </button>
              <button
                className="action-btn clear-all-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
              >
                Clear All
              </button>
            </div>

            {/* Options List */}
            <div className="multi-select-options-list">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <div
                    key={option}
                    className="multi-select-option"
                    onClick={() => handleToggle(option)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option)}
                      onChange={() => {}}
                    />
                    <label>{option}</label>
                  </div>
                ))
              ) : (
                <div className="no-results">No results found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;