import  { useMemo } from 'react';
import Select from 'react-select';
import countriesData from '../data/countries.json';

const CountrySelector = ({ 
  value, 
  onChange, 
  placeholder = "Select country", 
  className = "",
  error = false,
  disabled = false 
}) => {
  const countries = useMemo(() => {
    return [...countriesData.countries]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(country => ({
        value: country.phone_code,
        label: `${country.phone_code} - ${country.name}`,
        flag: country.flag,
        name: country.name,
        phone_code: country.phone_code
      }));
  }, []);

  const selectedOption = countries.find(country => country.value === value);

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '50px',
      border: error 
        ? '1px solid #ef4444' 
        : state.isFocused 
          ? '1px solid #0071E0' 
          : '1px solid #d1d5db',
      borderRadius: '8px',
      boxShadow: state.isFocused 
        ? '0 0 0 2px rgba(0, 113, 224, 0.2)' 
        : 'none',
      '&:hover': {
        border: error ? '1px solid #ef4444' : '1px solid #9ca3af'
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 8px'
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
      padding: '0px'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: '8px',
      color: '#6b7280'
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '4px',
      maxHeight: '200px'
    }),
    option: (provided, state) => ({
      ...provided,
      padding: '8px 12px',
      borderRadius: '6px',
      margin: '2px 0',
      backgroundColor: state.isSelected 
        ? '#0071E0' 
        : state.isFocused 
          ? '#f3f4f6' 
          : 'transparent',
      color: state.isSelected ? 'white' : '#374151',
      '&:hover': {
        backgroundColor: state.isSelected ? '#0071E0' : '#f3f4f6'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#9ca3af',
      fontSize: '14px'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#374151',
      fontSize: '14px'
    })
  };

  const formatOptionLabel = (option) => (
    <div className="flex items-center">
      <img 
        src={option.flag} 
        alt={option.name} 
        className="w-4 h-4 mr-2 flex-shrink-0" 
      />
      <span className="flex-1 truncate">{option.name}</span>
      <span className="ml-2 text-xs text-gray-500">{option.phone_code}</span>
    </div>
  );

  const handleChange = (selectedOption) => {
    onChange(selectedOption ? selectedOption.value : '');
  };

  return (
    <div className={className}>
      <Select
        value={selectedOption}
        onChange={handleChange}
        options={countries}
        placeholder={placeholder}
        isDisabled={disabled}
        isSearchable={true}
        isClearable={false}
        formatOptionLabel={formatOptionLabel}
        styles={customStyles}
        className="react-select-container"
        classNamePrefix="react-select"
        noOptionsMessage={() => "No countries found"}
        loadingMessage={() => "Loading countries..."}
        filterOption={(option, inputValue) => {
          const searchTerm = inputValue.toLowerCase();
          return (
            option.data.name.toLowerCase().includes(searchTerm) ||
            option.data.phone_code.includes(searchTerm)
          );
        }}
        components={{
          DropdownIndicator: () => (
            <div className="pr-2">
              <i className="fas fa-chevron-down text-xs text-gray-400"></i>
            </div>
          )
        }}
      />
    </div>
  );
};

export default CountrySelector;
