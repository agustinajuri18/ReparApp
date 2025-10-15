import React, { useState, useRef, useEffect } from 'react';

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Seleccionar...",
  displayFormat = (option) => option.toString(),
  filterKey = null,
  className = "form-select",
  disabled = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const selectRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter(option => {
        const searchValue = filterKey ? option[filterKey] : displayFormat(option);
        return searchValue.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options, filterKey, displayFormat]);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const selectedOption = options.find(opt => opt === value || (typeof opt === 'object' && opt.id === value));
  const displayValue = selectedOption ? displayFormat(selectedOption) : '';

  return (
    <div className="searchable-select" ref={selectRef} style={{ position: 'relative' }}>
      <div className="input-group">
        <input
          ref={inputRef}
          type="text"
          className={`form-control ${className.includes('is-invalid') ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          required={required}
          style={{ borderTopRightRadius: 0, borderBottomRightRadius: isOpen ? 0 : '0.375rem' }}
        />
        <button
          className={`btn btn-outline-secondary ${className.includes('is-invalid') ? 'is-invalid' : ''}`}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          style={{
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderLeft: 'none'
          }}
        >
          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`}></i>
        </button>
      </div>

      {isOpen && (
        <div
          className="dropdown-menu show w-100"
          style={{
            position: 'absolute',
            top: '100%',
            zIndex: 1100,
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #ced4da',
            borderRadius: '0.375rem',
            boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={typeof option === 'object' ? option.id || index : option}
                className="dropdown-item"
                type="button"
                onClick={() => handleSelect(option)}
                style={{ cursor: 'pointer' }}
              >
                {displayFormat(option)}
              </button>
            ))
          ) : (
            <div className="dropdown-item text-muted">No se encontraron resultados</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;