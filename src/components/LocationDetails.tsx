import type { VenueLocation } from "../domain/models";
export function LocationDetails({ location }: { location: VenueLocation }) {
  return (
    <div className="location-details">
      <dl>
        <div>
          <dt>Hall</dt>
          <dd>{location.hall}</dd>
        </div>
        <div>
          <dt>Floor / level</dt>
          <dd>{location.floor}</dd>
        </div>
        <div>
          <dt>Room</dt>
          <dd>{location.room}</dd>
        </div>
        <div>
          <dt>Meeting point</dt>
          <dd>{location.meetingPoint}</dd>
        </div>
      </dl>
      <p>{location.detailNote}</p>
      <a href={location.source} target="_blank" rel="noreferrer">
        Official location source · checked {location.checkedAt} ↗
      </a>
    </div>
  );
}
