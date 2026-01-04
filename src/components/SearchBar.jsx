import React from 'react';

function SearchBar({ value, onChange, placeholder = "Search..." }) {
    return (
        <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
                type="text"
                className="search-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}

export default SearchBar;
