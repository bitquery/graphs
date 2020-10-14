export const DetailLevel = (limit) => {
  return `<div class="detail-level">
						<span>Detail level</span>
						<div>
							<i class="fas fa-th-large"></i> <input class="detail-level__input" type="range" min="1" max="100" step="1" value="${limit}" title="Detail level"> <i class="fas fa-th"></i>
						</div>
					</div>`
}
