export function getPyqOptionClassName({ imageOnly, selected, review = false, correct = false }) {
  let className = `option ${imageOnly ? 'pyq-letter-option' : 'mock-option'}`;

  if (review) {
    if (correct) className += ' correct';
    else if (selected) className += ' incorrect selected';
    else className += ' fade';
  } else if (selected) {
    className += imageOnly ? ' selected' : ' mock-selected';
  }

  return className;
}
